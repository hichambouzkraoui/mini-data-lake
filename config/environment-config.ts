export interface Config {
  workerType: string;
  numberOfWorkers: number;
  maxRetries: number;
  timeout: number;
  dataTypes?: string[];
  logRetentionDays?: number;
  tableFormat?: 'iceberg' | 'external';
}

export const ENVIRONMENT_CONFIGS: Record<string, Config> = {
  dev: {
    workerType: 'G.1X',
    numberOfWorkers: 2,
    maxRetries: 0,
    timeout: 60,
    dataTypes: ['assets', 'sensors', 'readings', 'alerts', 'maintenance_events'],
    logRetentionDays: 7,
  },
  uat: {
    workerType: 'G.1X',
    numberOfWorkers: 2,
    maxRetries: 2,
    timeout: 120,
    dataTypes: ['assets', 'sensors', 'readings', 'alerts', 'maintenance_events'],
    logRetentionDays: 30,
  },
  prod: {
    workerType: 'G.2X',
    numberOfWorkers: 10,
    maxRetries: 3,
    timeout: 240,
    dataTypes: ['assets', 'sensors', 'readings', 'alerts', 'maintenance_events'],
    logRetentionDays: 90,
  },
};

export function getEnvironmentConfig(environment: string): Config {
  return ENVIRONMENT_CONFIGS[environment] || ENVIRONMENT_CONFIGS.dev;
}