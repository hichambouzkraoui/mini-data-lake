import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MiniDataLakeStack } from '../lib/stacks/mini-data-lake-stack';

describe('MiniDataLakeStack', () => {
  let app: cdk.App;
  let stack: MiniDataLakeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MiniDataLakeStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  test('creates all required constructs', () => {
    template.resourceCountIs('AWS::S3::Bucket', 2);
    template.resourceCountIs('AWS::Glue::Database', 1);
    template.resourceCountIs('AWS::Athena::WorkGroup', 1);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.resourceCountIs('AWS::KMS::Key', 1);
  });

  test('creates glue job', () => {
    template.resourceCountIs('AWS::Glue::Job', 1);
  });

  test('creates data lake storage with correct environment', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'datalake-raw-123456789012-us-east-1'
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'datalake-curated-123456789012-us-east-1'
    });
  });

  test('creates data catalog with correct database name', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      DatabaseInput: {
        Name: 'datalake_test'
      }
    });
  });

  test('creates athena workgroup with correct configuration', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      Name: 'datalake-workgroup-123456789012-us-east-1'
    });
  });

  test('creates monitoring log group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/datalake/processing'
    });
  });
});