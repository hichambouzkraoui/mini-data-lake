#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MiniDataLakeStack } from '../lib/stacks/mini-data-lake-stack';

const app = new cdk.App();
new MiniDataLakeStack(app, 'MiniDataLakeStack', {
  environment: 'dev',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});