import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataDeployment } from '../../lib/constructs/data-deployment';

describe('DataDeployment', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let rawBucket: s3.Bucket;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    rawBucket = new s3.Bucket(stack, 'RawBucket');
    
    new DataDeployment(stack, 'DataDeployment', {
      rawBucket,
      dataTypes: ['assets', 'sensors', 'readings', 'alerts', 'maintenance_events']
    });
    
    template = Template.fromStack(stack);
  });

  test('creates exactly 5 bucket deployments', () => {
    template.resourceCountIs('Custom::CDKBucketDeployment', 5);
  });

  test('creates IAM roles for bucket deployments', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });
});