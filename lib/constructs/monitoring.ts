import { RemovalPolicy } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Config } from '../../config/environment-config';

export interface MonitoringProps {
  readonly config: Config;
}

export class Monitoring extends Construct {
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const retentionDays = this.getRetentionDays(props.config.logRetentionDays || 30);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/aws/datalake/processing',
      retention: retentionDays,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private getRetentionDays(days: number): logs.RetentionDays {
    const retentionMap: Record<number, logs.RetentionDays> = {
      7: logs.RetentionDays.ONE_WEEK,
      30: logs.RetentionDays.ONE_MONTH,
      90: logs.RetentionDays.THREE_MONTHS,
    };
    return retentionMap[days] || logs.RetentionDays.ONE_MONTH;
  }
}