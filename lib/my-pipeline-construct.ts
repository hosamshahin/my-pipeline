import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { MyPipelineAppStage } from './my-pipeline-app-stage';

enum EnvIdName {
  cicd = 'CICD_ACCOUNT_ID',
  dev = 'DEV_ACCOUNT_ID',
  stg = 'STG_ACCOUNT_ID',
  prd = 'PRD_ACCOUNT_ID'
}

export interface MyPipelineProps {
  readonly deploymentEnv: string;
  readonly account: string;
  readonly region: string;
  readonly githubOrg: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly preApprovalRequired: boolean | false;
}

export class MyPipeline extends Construct {
  constructor(scope: Construct, id: string, props: MyPipelineProps) {
    super(scope, id);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      pipelineName: `Pipeline-${props.deploymentEnv}`,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(`${props.githubOrg}/${props.githubRepo}`, props.githubBranch),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          environmentVariables: {
            CICD_ACCOUNT_ID: { value: cdk.SecretValue.secretsManager('CICD_ACCOUNT_ID').unsafeUnwrap().toString() },
            DEV_ACCOUNT_ID: { value: cdk.SecretValue.secretsManager('DEV_ACCOUNT_ID').unsafeUnwrap().toString() },
            STG_ACCOUNT_ID: { value: cdk.SecretValue.secretsManager('STG_ACCOUNT_ID').unsafeUnwrap().toString() },
            PRD_ACCOUNT_ID: { value: cdk.SecretValue.secretsManager('PRD_ACCOUNT_ID').unsafeUnwrap().toString() },
            PRD_ACCOUNT_ID1: { value: cdk.SecretValue.secretsManager('PRD_ACCOUNT_ID').unsafeUnwrap().toString() },
          }
        }
      }
    });

    const myApp = new MyPipelineAppStage(this, 'MyApp', {
      env: { account: props.account, region: props.region }
    })

    const myStage = pipeline.addStage(myApp);

    if (props.preApprovalRequired) {
      myStage.addPre(new ManualApprovalStep('approval'));
    }
  }
}