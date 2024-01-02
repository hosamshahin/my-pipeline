import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pipeline } from './pipeline-construct';

export class FeaturePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = this.node.tryGetContext("config")

    new Pipeline(this, 'feature', {
      deploymentEnv: 'cicd',
      deploymentAcct: 'CICD_ACCOUNT_ID',
      region: config.region,
      githubOrg: config.githubOrg,
      githubRepo: config.githubRepo,
      githubBranch: 'not_exist_branch_to_avoid_running',
      preApprovalRequired: true,
      pipelineGenerator: false,
      codeBuildCommands: [
        "echo $CODEBUILD_INITIATOR",
        "BRANCH=$(echo $CODEBUILD_INITIATOR | sed -E 's/.*\/(feature-.*)-.*/\x01/')",
        "echo $feature_pipeline_suffix",
        "echo $BRANCH",
        'npm ci',
        'npm run build',
        "cdk list -c branch_name=$BRANCH",
        "cdk synth -c branch_name=$BRANCH",
        "echo branch: $BRANCH; cdk list -c branch_name=$BRANCH",
        "echo branch: $BRANCH; cdk synth -c branch_name=$BRANCH",
      ]
    });

  }
}