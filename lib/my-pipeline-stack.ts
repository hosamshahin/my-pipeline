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

    const myAppEUW1Stage = new MyPipelineAppStage(this, 'MyAppEU', {
      env: { account: '690901106489', region: 'eu-west-1' }
    })

    const myAppUSW1Stage = new MyPipelineAppStage(this, 'MyAppUS', {
      env: { account: '690901106489', region: 'us-west-1' }
    })

    const myAppUSE1StageDev = new MyPipelineAppStage(this, 'MyAppUSE1DEV', {
      env: { account: '864571753663', region: 'us-east-1' }
    })

    const myAppEUW1Wave = wave.addStage(myAppEUW1Stage);
    myAppEUW1Wave.addPre(new ManualApprovalStep('approval'));

    const myAppUSW1Wave = wave.addStage(myAppUSW1Stage);
    myAppUSW1Wave.addPre(new ManualApprovalStep('approval'));

    const myAppUSE1WaveDev = wave.addStage(myAppUSE1StageDev);
    myAppUSE1WaveDev.addPre(new ManualApprovalStep('approval'));
  }
}

