#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MiniDataLakeStack } from '../lib/stacks/mini-data-lake-stack';
import { getEnvironmentConfig } from '../config/environment-config';

const app = new cdk.App();

const env = app.node.tryGetContext('environment') || 'dev';
const tableFormat = app.node.tryGetContext('tableFormat') || 'iceberg';
const config = { ...getEnvironmentConfig(env), tableFormat };

new MiniDataLakeStack(app, `MiniDataLakeStack-${env}`, {
  environment: env,
  config,
});