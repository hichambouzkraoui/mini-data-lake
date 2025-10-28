import { Stack } from 'aws-cdk-lib';
import * as glue from 'aws-cdk-lib/aws-glue';
import { Construct } from 'constructs';

export interface DataCatalogProps {
  readonly databaseName: string;
}

export class DataCatalog extends Construct {
  public readonly database: glue.CfnDatabase;

  constructor(scope: Construct, id: string, props: DataCatalogProps) {
    super(scope, id);

    this.database = new glue.CfnDatabase(this, 'Database', {
      catalogId: Stack.of(this).account,
      databaseInput: {
        name: props.databaseName,
        description: 'Data lake database for curated Iceberg tables',
        parameters: {
          table_type: 'ICEBERG',
        },
      },
    });
  }
}