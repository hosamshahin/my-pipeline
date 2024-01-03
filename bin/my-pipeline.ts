#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Pipeline } from '../lib/pipeline-construct';
import { PipelineGeneratorStage } from '../lib/pipeline-generator-stage';

const app = new cdk.App();

const config = app.node.tryGetContext("config")

const pipeline = new cdk.Stack(app, 'Pipeline', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});

new Pipeline(pipeline, 'Prd', {
  deploymentEnv: 'prd',
  deploymentAcct: 'PRD_ACCOUNT_ID',
  region: config.region,
  githubOrg: config.githubOrg,
  githubRepo: config.githubRepo,
  githubBranch: config.githubBranch,
  preApprovalRequired: true,
  pipelineGenerator: false
});


new Pipeline(pipeline, 'PGen', {
  deploymentEnv: 'PGen',
  deploymentAcct: 'DEV_ACCOUNT_ID',
  region: config.region,
  githubOrg: config.githubOrg,
  githubRepo: config.githubRepo,
  githubBranch: config.githubBranch,
  preApprovalRequired: false,
  pipelineGenerator: true,
});

app.synth();