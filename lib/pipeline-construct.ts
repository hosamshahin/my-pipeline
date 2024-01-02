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
}

export class Pipeline extends Construct {
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const accountSecret = cdk.SecretValue.secretsManager(props.deploymentAcct).unsafeUnwrap().toString()
    const accountId = process['env'][props.deploymentAcct] || accountSecret;

    let environmentVariables: any = {}
    environmentVariables[props.deploymentAcct] = { value: accountSecret }

    const defultSynth: ShellStep = new ShellStep('Synth', {
      input: CodePipelineSource.gitHub(`${props.githubOrg}/${props.githubRepo}`, props.githubBranch),
      commands: [
        'npm ci',
        'npm run build',
        'npx cdk synth'
      ],
    })

    const codeBuildSynth = new CodeBuildStep('Synth', {
      input: CodePipelineSource.gitHub(`${props.githubOrg}/${props.githubRepo}`, props.githubBranch),
      commands: [
        "echo $CODEBUILD_INITIATOR",
        "BRANCH=$(echo $CODEBUILD_INITIATOR | sed -E 's/.*\/(feature-.*)-.*/\x01/')",
        "echo $feature_pipeline_suffix",
        "echo $BRANCH",
        'npm ci',
        'npm run build',
        "cdk list -c branch_name=$BRANCH",
        "cdk synth -c branch_name=$BRANCH"
      ],
      env: { 'BRANCH': 'not_exist_branch_to_avoid_running' }
    })




    const pipeline = new CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      selfMutation: false,
      pipelineName: `Pipeline-${props.deploymentEnv}`,
      synth: props.pipelineGenerator ? codeBuildSynth : defultSynth,
      codeBuildDefaults: {
        buildEnvironment: {
          environmentVariables
        }
      }
    });

    let stage: cdk.Stage

    if (props.pipelineGenerator) {
      stage = new PipelineGeneratorStage(this, 'PipelineGeneratorStage', {
        env: { account: accountId, region: props.region }
      })
    } else {
      stage = new AppStage(this, 'AppStage', {
        env: { account: accountId, region: props.region }
      })
    }

    const pipelineStage = pipeline.addStage(stage);
    if (props.preApprovalRequired) {
      pipelineStage.addPre(new ManualApprovalStep('approval'));
    }
  }
}