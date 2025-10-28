import { Stack } from 'aws-cdk-lib';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface GlueJobProps {
  readonly rawBucket: s3.Bucket;
  readonly curatedBucket: s3.Bucket;
  readonly kmsKey: kms.Key;
  readonly databaseName: string;
}

export class GlueJob extends Construct {
  public readonly role: iam.Role;
  public readonly job: glue.CfnJob;

  constructor(scope: Construct, id: string, props: GlueJobProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
      inlinePolicies: {
        IcebergPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'glue:GetTable',
                'glue:GetTables',
                'glue:CreateTable',
                'glue:UpdateTable',
                'glue:DeleteTable',
                'glue:GetPartitions',
                'glue:CreatePartition',
                'glue:UpdatePartition',
                'glue:DeletePartition',
                'glue:BatchCreatePartition',
                'glue:BatchDeletePartition',
                'glue:BatchUpdatePartition',
              ],
              resources: [
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:catalog`,
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:database/${props.databaseName}`,
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:table/${props.databaseName}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:CopyObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                props.rawBucket.bucketArn,
                `${props.rawBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    props.rawBucket.grantReadWrite(this.role);
    props.curatedBucket.grantReadWrite(this.role);
    props.kmsKey.grantDecrypt(this.role);
    props.kmsKey.grantEncrypt(this.role);

    const scriptDeployment = new s3deploy.BucketDeployment(this, 'Scripts', {
      sources: [s3deploy.Source.asset('./scripts')],
      destinationBucket: props.rawBucket,
      destinationKeyPrefix: 'scripts/',
    });

    this.job = new glue.CfnJob(this, 'Job', {
      name: 'datalake-iceberg-transform-job',
      role: this.role.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${props.rawBucket.bucketName}/scripts/transform_data.py`,
        pythonVersion: '3',
      },
      defaultArguments: {
        '--RAW_BUCKET': props.rawBucket.bucketName,
        '--CURATED_BUCKET': props.curatedBucket.bucketName,
        '--DATABASE_NAME': props.databaseName,
        '--enable-continuous-cloudwatch-log': 'true',
        '--enable-metrics': 'true',
        '--datalake-formats': 'iceberg',
        '--conf': [
          'spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions',
          'spark.sql.catalog.glue_catalog=org.apache.iceberg.spark.SparkCatalog',
          `spark.sql.catalog.glue_catalog.warehouse=s3://${props.curatedBucket.bucketName}/iceberg/`,
          'spark.sql.catalog.glue_catalog.catalog-impl=org.apache.iceberg.aws.glue.GlueCatalog',
          'spark.sql.catalog.glue_catalog.io-impl=org.apache.iceberg.aws.s3.S3FileIO',
          'spark.sql.iceberg.handle-timestamp-without-timezone=true',
          'spark.sql.adaptive.enabled=true',
          'spark.sql.adaptive.coalescePartitions.enabled=true',
        ].join(' --conf '),
        '--additional-python-modules': 'boto3',
      },
      maxRetries: 1,
      timeout: 60,
      glueVersion: '4.0',
      workerType: 'G.1X',
      numberOfWorkers: 2,
    });

    this.job.node.addDependency(scriptDeployment);
  }
}