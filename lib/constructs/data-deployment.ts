import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface DataDeploymentProps {
  readonly rawBucket: s3.Bucket;
  readonly dataTypes: string[];
}

export class DataDeployment extends Construct {
  constructor(scope: Construct, id: string, props: DataDeploymentProps) {
    super(scope, id);
    
    props.dataTypes.forEach(dataType => {
      new s3deploy.BucketDeployment(this, `Deploy${dataType}`, {
        sources: [s3deploy.Source.asset(`./data/seeds/${dataType}`)],
        destinationBucket: props.rawBucket,
        destinationKeyPrefix: `input/${dataType}/`,
        //include: [`${dataType}*.csv`],
        //exclude: dataTypes.filter(t => t !== dataType).map(t => `${t}*.csv`),
      });
    });
  }
}