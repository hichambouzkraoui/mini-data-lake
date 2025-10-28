import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataLakeStorage } from '../../lib/constructs/data-lake-storage';

describe('DataLakeStorage', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    new DataLakeStorage(stack, 'DataLakeStorage', {
      environment: 'test'
    });
    
    template = Template.fromStack(stack);
  });

  test('creates KMS key with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for data lake encryption',
      EnableKeyRotation: true
    });
  });

  test('creates raw S3 bucket with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'datalake-raw-123456789012-us-east-1',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms'
          }
        }]
      },
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('creates curated S3 bucket with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'datalake-curated-123456789012-us-east-1',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms'
          }
        }]
      },
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('creates exactly 2 S3 buckets', () => {
    template.resourceCountIs('AWS::S3::Bucket', 2);
  });

  test('creates exactly 1 KMS key', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
  });
});