import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Monitoring } from '../../lib/constructs/monitoring';
import { getEnvironmentConfig } from '../../config/environment-config';

describe('Monitoring', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    const config = getEnvironmentConfig('dev');
    
    new Monitoring(stack, 'Monitoring', { config });
    
    template = Template.fromStack(stack);
  });

  test('creates log group with correct configuration', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/datalake/processing',
      RetentionInDays: 7
    });
  });

  test('creates exactly 1 log group', () => {
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });
});