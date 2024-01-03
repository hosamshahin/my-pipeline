import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, ManualApprovalStep, CodeBuildStep, CodePipelineProps, StageDeployment } from 'aws-cdk-lib/pipelines';
import { AppStage } from './app-stage';
import { PipelineGeneratorStage } from './pipeline-generator-stage';

enum EnvIdName {
  cicd = 'CICD_ACCOUNT_ID',
  dev = 'DEV_ACCOUNT_ID',
  stg = 'STG_ACCOUNT_ID',
  prd = 'PRD_ACCOUNT_ID'
}

export interface PipelineProps {
  readonly deploymentEnv: string;
  readonly deploymentAcct: string;
  readonly region: string;
  readonly githubOrg: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly preApprovalRequired: boolean | false;
  readonly pipelineGenerator: boolean | false;
  readonly codeBuildCommands?: Array<string>;
}

export class Pipeline extends Construct {
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const config = this.node.tryGetContext("config")
    const accounts = config['accounts']
    const connectionArn = config['connection_arn']
    const input: cdk.pipelines.IFileSetProducer = CodePipelineSource.connection(
      `${props.githubOrg}/${props.githubRepo}`,
      props.githubBranch,
      { connectionArn }
    )

    const defultSynth: ShellStep = new ShellStep('Synth', {
      input,
      commands: [
        'npm ci',
        'npm run build',
        'npx cdk synth'
      ],
    })

    let defaultCommands: Array<string> = [
      'npm ci',
      'npm run build',
      "echo branch: $BRANCH; npx cdk list -c branch_name=$BRANCH",
      "echo branch: $BRANCH; npx cdk synth -c branch_name=$BRANCH"
    ]

    const codeBuildSynth = new CodeBuildStep('Synth', {
      input,
      commands: props.codeBuildCommands ? props.codeBuildCommands : defaultCommands,
      env: { 'BRANCH': 'not_exist_branch_to_avoid_running' }
    })

    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      selfMutation: false,
      pipelineName: `Pipeline-${props.deploymentEnv}`,
      synth: props.pipelineGenerator ? codeBuildSynth : defultSynth
    });

    let stage: cdk.Stage

    if (props.pipelineGenerator) {
      stage = new PipelineGeneratorStage(this, 'PipelineGenerator', {
        env: { account: cdk.Stack.of(this).account, region: props.region }
      })
    } else {
      stage = new AppStage(this, 'AppStage', {
        env: { account: accounts[props.deploymentAcct], region: props.region }
      })
    }

    const pipelineStage = pipeline.addStage(stage);
    if (props.preApprovalRequired) {
      pipelineStage.addPre(new ManualApprovalStep('approval'));
    }
  }
}