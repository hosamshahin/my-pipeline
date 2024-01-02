import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pipeline } from './pipeline-construct';

export class FeaturePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = this.node.tryGetContext("config")

    new Pipeline(this, 'feature', {
      deploymentEnv: 'dev',
      deploymentAcct: 'DEV_ACCOUNT_ID',
      region: config.region,
      githubOrg: config.githubOrg,
      githubRepo: config.githubRepo,
      githubBranch: 'not_exist_branch_to_avoid_running',
      preApprovalRequired: true,
      pipelineGenerator: false
    });

  }
}