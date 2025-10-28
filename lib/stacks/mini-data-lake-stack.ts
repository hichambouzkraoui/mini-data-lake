import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataLakeStorage } from '../constructs/data-lake-storage';
import { DataCatalog } from '../constructs/data-catalog';
import { AthenaWorkgroup } from '../constructs/athena-workgroup';

export interface MiniDataLakeStackProps extends cdk.StackProps {
  readonly environment: string;
}

export class MiniDataLakeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MiniDataLakeStackProps) {
    super(scope, id, props);

    const dataLakeStorage = new DataLakeStorage(this, 'DataLakeStorage', {
      environment: props.environment
    });

    new DataCatalog(this, 'DataCatalog', {
      databaseName: `datalake-${props.environment}`
    });

    new AthenaWorkgroup(this, 'AthenaWorkgroup', {
      curatedBucket: dataLakeStorage.curatedBucket,
      kmsKey: dataLakeStorage.kmsKey,
      environment: props.environment
    });
  }
}
