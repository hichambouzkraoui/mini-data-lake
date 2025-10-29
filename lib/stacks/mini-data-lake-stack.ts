import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataLakeStorage } from '../constructs/data-lake-storage';
import { DataCatalog } from '../constructs/data-catalog';
import { AthenaWorkgroup } from '../constructs/athena-workgroup';
import { DataDeployment } from '../constructs/data-deployment';
import { GlueJob } from '../constructs/glue-job';
import { Monitoring } from '../constructs/monitoring';
import { Config } from '../../config/environment-config';

export interface MiniDataLakeStackProps extends cdk.StackProps {
  readonly environment: string;
  readonly config: Config;
}

export class MiniDataLakeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MiniDataLakeStackProps) {
    super(scope, id, props);

    const storage = new DataLakeStorage(this, 'DataLakeStorage', {
      environment: props.environment
    });

    const catalog = new DataCatalog(this, 'DataCatalog', {
      databaseName: `datalake_${props.environment}`
    });

    const athena = new AthenaWorkgroup(this, 'AthenaWorkgroup', {
      curatedBucket: storage.curatedBucket,
      kmsKey: storage.kmsKey,
      environment: props.environment
    });

        const glueJob = new GlueJob(this, 'GlueJob', {
      rawBucket: storage.rawBucket,
      curatedBucket: storage.curatedBucket,
      kmsKey: storage.kmsKey,
      databaseName: `datalake_${props.environment}`,
      config: props.config,
    });

    new DataDeployment(this, 'DataDeployment', {
      rawBucket: storage.rawBucket,
      dataTypes: props.config.dataTypes || [],
    });

    new Monitoring(this, 'Monitoring', {
      config: props.config,
    });

    // Grant Athena role access to raw bucket
    storage.rawBucket.grantRead(athena.role);
  }
}
