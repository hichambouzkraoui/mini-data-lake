import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { AthenaWorkgroup } from '../../lib/constructs/athena-workgroup';

describe('AthenaWorkgroup', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let curatedBucket: s3.Bucket;
  let kmsKey: kms.Key;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    kmsKey = new kms.Key(stack, 'TestKey');
    curatedBucket = new s3.Bucket(stack, 'TestBucket');
    
    new AthenaWorkgroup(stack, 'AthenaWorkgroup', {
      curatedBucket,
      kmsKey,
      environment: 'test'
    });
    
    template = Template.fromStack(stack);
  });

  test('creates IAM role with correct trust policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'athena.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });

  test('creates workgroup with correct configuration', () => {
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
      Name: 'datalake-workgroup-123456789012-us-east-1',
      Description: 'Workgroup for data lake queries',
      State: 'ENABLED',
      WorkGroupConfiguration: {
        ResultConfiguration: {
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_KMS'
          }
        },
        EnforceWorkGroupConfiguration: true
      }
    });
  });

  test('creates exactly 1 workgroup', () => {
    template.resourceCountIs('AWS::Athena::WorkGroup', 1);
  });

  test('creates exactly 1 IAM role', () => {
    template.resourceCountIs('AWS::IAM::Role', 1);
  });
});