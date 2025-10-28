import { Stack } from 'aws-cdk-lib';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface AthenaWorkgroupProps {
  readonly curatedBucket: s3.Bucket;
  readonly kmsKey: kms.Key;
  readonly environment: string;
}

export class AthenaWorkgroup extends Construct {
  public readonly workgroup: athena.CfnWorkGroup;
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: AthenaWorkgroupProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('athena.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess'),
      ],
    });

    props.curatedBucket.grantReadWrite(this.role);
    props.kmsKey.grantDecrypt(this.role);

    this.workgroup = new athena.CfnWorkGroup(this, 'Workgroup', {
      name: `datalake-workgroup-${Stack.of(this).account}-${Stack.of(this).region}`,
      description: 'Workgroup for data lake queries',
      state: 'ENABLED',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${props.curatedBucket.bucketName}/athena-results/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_KMS',
            kmsKey: props.kmsKey.keyArn,
          },
        },
        enforceWorkGroupConfiguration: true,
      },
    });
  }
}