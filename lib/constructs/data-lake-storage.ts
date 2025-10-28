import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DataLakeStorageProps {
  readonly environment: string;
}

export class DataLakeStorage extends Construct {
  public readonly kmsKey: kms.Key;
  public readonly rawBucket: s3.Bucket;
  public readonly curatedBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataLakeStorageProps) {
    super(scope, id);

    this.kmsKey = new kms.Key(this, 'Key', {
      description: 'KMS key for data lake encryption',
      enableKeyRotation: true,
    });

    this.rawBucket = new s3.Bucket(this, 'RawBucket', {
      bucketName: `datalake-raw-${Stack.of(this).account}-${Stack.of(this).region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.curatedBucket = new s3.Bucket(this, 'CuratedBucket', {
      bucketName: `datalake-curated-${Stack.of(this).account}-${Stack.of(this).region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}