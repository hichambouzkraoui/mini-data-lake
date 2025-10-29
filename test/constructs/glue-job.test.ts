import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { GlueJob } from '../../lib/constructs/glue-job';
import { getEnvironmentConfig } from '../../config/environment-config';

describe('GlueJob', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let rawBucket: s3.Bucket;
  let curatedBucket: s3.Bucket;
  let kmsKey: kms.Key;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    kmsKey = new kms.Key(stack, 'TestKey');
    rawBucket = new s3.Bucket(stack, 'RawBucket');
    curatedBucket = new s3.Bucket(stack, 'CuratedBucket');
    const config = getEnvironmentConfig('dev');
    
    new GlueJob(stack, 'GlueJob', {
      rawBucket,
      curatedBucket,
      kmsKey,
      databaseName: 'test_database',
      config
    });
    
    template = Template.fromStack(stack);
  });

  test('creates IAM role with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'glue.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });

  test('creates Glue job with correct configuration', () => {
    template.hasResourceProperties('AWS::Glue::Job', {
      Name: 'datalake-iceberg-transform-job',
      Command: {
        Name: 'glueetl',
        PythonVersion: '3'
      },
      MaxRetries: 0,
      Timeout: 60,
      GlueVersion: '4.0',
      WorkerType: 'G.1X',
      NumberOfWorkers: 2
    });
  });

  test('creates exactly 1 Glue job', () => {
    template.resourceCountIs('AWS::Glue::Job', 1);
  });

  test('creates exactly 2 IAM roles', () => {
    template.resourceCountIs('AWS::IAM::Role', 2);
  });
});