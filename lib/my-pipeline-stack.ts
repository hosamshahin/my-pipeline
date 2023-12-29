import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { MyPipelineAppStage } from './my-pipeline-app-stage';
import * as dotenv from 'dotenv';

dotenv.config();

export class MyPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubOrg = process.env.GITHUB_ORG || "hosamshahin";
    const githubRepo = process.env.GITHUB_REPO || "my-pipeline";
    const githubBranch = process.env.GITHUB_BRANCH || "main";
    const cicdAccountId = process.env.CICD_ACCOUNT_ID || cdk.SecretValue.ssmSecure('CICD_ACCOUNT_ID').toString();
    const devAccountId = process.env.DEV_ACCOUNT_ID || cdk.SecretValue.ssmSecure('DEV_ACCOUNT_ID').toString();
    const stgAccountId = process.env.STG_ACCOUNT_ID || cdk.SecretValue.ssmSecure('STG_ACCOUNT_ID').toString();
    const prdAccountId = process.env.PRD_ACCOUNT_ID || cdk.SecretValue.ssmSecure('PRD_ACCOUNT_ID').toString();
    const euw1Region = process.env.EUW1_REGION || "eu-west-1";
    const use1Region = process.env.USE1_REGION || "us-east-1";
    const usw1Region = process.env.USE1_REGION || "us-west-1";

    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(`${githubOrg}/${githubRepo}`, githubBranch),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    const myAppCicdEUW1Stage = new MyPipelineAppStage(this, 'MyAppEU', {
      env: { account: cicdAccountId, region: euw1Region }
    })

    const myAppCicdUSW1Stage = new MyPipelineAppStage(this, 'MyAppUS', {
      env: { account: cicdAccountId, region: use1Region }
    })

    const myAppDevUSE1Stage = new MyPipelineAppStage(this, 'MyAppUSE1DEV', {
      env: { account: devAccountId, region: use1Region }
    })

    const myAppStgUSE1Stage = new MyPipelineAppStage(this, 'MyAppStgUSE1Stage', {
      env: { account: stgAccountId, region: euw1Region }
    })

    const myAppPrdUSW1Stage = new MyPipelineAppStage(this, 'myAppPrdUSW1Stage', {
      env: { account: prdAccountId, region: usw1Region }
    })

    const wave = pipeline.addWave('wave');

    wave.addStage(myAppCicdEUW1Stage);
    wave.addStage(myAppCicdUSW1Stage);
    wave.addStage(myAppDevUSE1Stage);

    const myAppStgUSE1Wave = wave.addStage(myAppStgUSE1Stage);
    myAppStgUSE1Wave.addPre(new ManualApprovalStep('approval'));

    const myAppPrdUSW1Wave = wave.addStage(myAppPrdUSW1Stage);
    myAppPrdUSW1Wave.addPre(new ManualApprovalStep('approval'));
  }
}

