import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DataCatalog } from '../../lib/constructs/data-catalog';

describe('DataCatalog', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    
    new DataCatalog(stack, 'DataCatalog', {
      databaseName: 'test-database'
    });
    
    template = Template.fromStack(stack);
  });

  test('creates Glue database with correct configuration', () => {
    template.hasResourceProperties('AWS::Glue::Database', {
      CatalogId: '123456789012',
      DatabaseInput: {
        Name: 'test-database',
        Description: 'Data lake database for curated Iceberg tables',
        Parameters: {
          table_type: 'ICEBERG'
        }
      }
    });
  });

  test('creates exactly 1 Glue database', () => {
    template.resourceCountIs('AWS::Glue::Database', 1);
  });
});