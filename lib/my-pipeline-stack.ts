import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { MyPipelineAppStage } from './my-pipeline-app-stage';

export class MyPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('hosamshahin/my-pipeline', 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    const wave = pipeline.addWave('wave');
    const myAppEUStage = new MyPipelineAppStage(this, 'MyAppEU', {
      env: { account: '690901106489', region: 'eu-west-1' }
    })

    const myAppUSStage= new MyPipelineAppStage(this, 'MyAppUS', {
      env: { account: '690901106489', region: 'us-west-1' }
    })

    const myAppEUWave = wave.addStage(myAppEUStage);
    myAppEUWave.addPre(new ManualApprovalStep('approval'));

    const myAppUSWave =wave.addStage(myAppUSStage);
    myAppUSWave.addPre(new ManualApprovalStep('approval'));
  }
}

