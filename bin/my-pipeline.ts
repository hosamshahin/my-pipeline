#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyPipeline } from '../lib/my-pipeline-construct';

const githubOrg = 'hosamshahin';
const githubRepo = 'my-pipeline';
const githubBranch = 'main';
const region = 'us-east-1'

const app = new cdk.App();

const pipelineStack = new cdk.Stack(app, 'Pipeline', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});



new MyPipeline(pipelineStack, 'Dev', {
  deploymentEnv: 'dev',
  deploymentAcct: 'DEV_ACCOUNT_ID',
  account: cdk.SecretValue.secretsManager('DEV_ACCOUNT_ID').unsafeUnwrap().toString(),
  region,
  githubOrg,
  githubRepo,
  githubBranch: 'dev',
  preApprovalRequired: false
});

// new MyPipeline(pipelineStack, 'Prd', {
//   deploymentEnv: 'prd',
//   deploymentAcct: 'PRD_ACCOUNT_ID',
//   account: cdk.SecretValue.secretsManager('PRD_ACCOUNT_ID').unsafeUnwrap().toString(),
//   region,
//   githubOrg,
//   githubRepo,
//   githubBranch,
//   preApprovalRequired: true
// });

app.synth();