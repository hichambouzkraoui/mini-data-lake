# Mini Data Lake

A CDK TypeScript project that creates a secure data lake infrastructure with encrypted S3 buckets for raw and curated data using Apache Iceberg format.

## Architecture

### Components
- **DataLakeStorage**: KMS-encrypted S3 buckets (raw/curated) with versioning and public access blocking
- **DataCatalog**: AWS Glue Data Catalog for metadata management
- **GlueJob**: ETL job with Iceberg support for data transformation
- **AthenaWorkgroup**: Query engine for analytics with result encryption
- **DataDeployment**: Automated seed data deployment to raw bucket
- **Monitoring**: CloudWatch logs and metrics collection

### Data Schema
The data lake processes five main data types:
- **Assets**: Equipment and infrastructure metadata
- **Sensors**: Sensor configuration and calibration data
- **Readings**: Time-series sensor measurements (partitioned by year/month)
- **Alerts**: System alerts and notifications
- **Maintenance Events**: Scheduled and completed maintenance activities

### Data Flow
1. Raw CSV data ingested to S3 raw bucket (`input/{datatype}/`)
2. Glue job processes data using Iceberg format
3. Transformed Parquet data stored in curated bucket (`external/{datatype}/`)
4. Athena queries curated data through Glue Catalog
5. successfull files moved (`processed/{datatype}/`)
6. Failed files moved to error prefix for review (`error/{datatype}/`)

## Project Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured
- CDK CLI: `npm install -g aws-cdk`

### Installation
```bash
git clone <repository>
cd mini-data-lake
npm install
npm run build
```

### Local Development
```bash
npm run build    # Compile TypeScript
npm run watch    # Auto-compile TypeScript
npm run test     # Run unit tests
npm run clean    # Remove compiled JS/TS files
npx cdk diff     # Preview changes
npx cdk synth    # Generate CloudFormation
```

## CI/CD Pipeline

### GitHub Setup

#### 1. AWS OIDC Provider Setup
```bash
# Create OIDC identity provider in AWS IAM
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com
```

#### 2. Create IAM Role for GitHub Actions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::{account}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:{org}/{repo}:*"
        }
      }
    }
  ]
}
```

#### 3. GitHub Repository Variables
Set these variables in GitHub Settings > Secrets and variables > Actions > Variables:
- `AWS_ROLE_ARN`: `arn:aws:iam::{account}:role/GitHubActionsRole`
- `AWS_REGION`: Your deployment region (e.g., `us-east-1`)

#### 4. GitHub Environments
Create environments in GitHub Settings > Environments:
- **dev**: No protection rules
- **uat**: Require branches to be up to date
- **prod**: Required reviewers + deployment branches (tags only)

### Environments
- **Dev**: Auto-deploy on PR approval/ready for review
- **UAT**: Auto-deploy on main branch push
- **Prod**: Auto-deploy on version tags (v*)

### Workflows
- **CI**: Runs tests on all PRs and main pushes
- **Deploy**: Multi-environment deployment with OIDC authentication

### Deployment
```bash
# Bootstrap CDK for each environment (required once per account/region)
npx cdk bootstrap

# Manual deployment
./scripts/deploy.sh [environment] [aws-profile]

# Environment-specific
npx cdk deploy --context environment=dev

# Create production release
git tag v1.0.0
git push origin v1.0.0
```

## Observability

### Logs
- **Glue Job Logs**: `/aws/glue/jobs/datalake-iceberg-transform-job` (CloudWatch Logs)
- **Data Lake Processing**: `/aws/datalake/processing` (CloudWatch Logs)
- **CDK Deployment**: Check CloudFormation events in AWS Console

### Metrics
- **Glue Job Metrics**: CloudWatch > Metrics > AWS/Glue
  - Job success/failure rates
  - Job duration
  - DPU usage
- **S3 Metrics**: CloudWatch > Metrics > AWS/S3
  - Bucket size
  - Number of objects
  - Request metrics
- **Athena Metrics**: CloudWatch > Metrics > AWS/Athena
  - Query execution time
  - Data scanned per query

## Data Processing

### Iceberg Format
- **Glue Version**: 4.0 with native Iceberg support
- **Format Version**: 2 (latest) for optimal performance
- **Partitioning**: Time-based partitioning on readings table (year/month)
- **Storage**: Parquet format in curated bucket

### Environment Configuration
- **Dev**: G.1X workers (2), 60min timeout, 7-day log retention
- **UAT**: G.1X workers (2), 120min timeout, 30-day log retention
- **Prod**: G.2X workers (10), 240min timeout, 90-day log retention

### Iceberg Availability & Fallbacks

#### Regional Support
Iceberg support varies by AWS region. For regions without Glue 4.0 or Iceberg support:

1. **Configure External Tables Mode**:
   ```bash
   # Deploy with external tables fallback
   npx cdk deploy --context environment=dev --context tableFormat=external
   ```

2. **Update Environment Config**:
   Add `tableFormat: 'external'` to environment configuration:
   ```typescript
   // config/environment-config.ts
   dev: {
     // ... other config
     tableFormat: 'external'
   }
   ```

3. **Manual Table Creation**:
   Run the SQL scripts in `sql/external_tables.sql` in Athena to create external tables:
   ```sql
   -- Replace {account} and {region} with actual values
   CREATE EXTERNAL TABLE assets (...)
   LOCATION 's3://datalake-curated-{account}-{region}/external/assets/';
   ```

#### Supported Regions (Iceberg)
- **US**: us-east-1, us-west-2, us-east-2, us-west-1
- **EU**: eu-west-1, eu-central-1, eu-west-2, eu-west-3
- **APAC**: ap-southeast-1, ap-southeast-2, ap-northeast-1, ap-south-1

#### Fallback Behavior
- **Automatic**: Job detects Iceberg failures and creates standard Parquet tables
- **Manual Override**: Use `tableFormat=external` context for explicit external table mode
- **Data Compatibility**: Both formats store data as Parquet in same S3 locations

### Error Handling
- **Table Creation**: Falls back to standard Spark tables if Iceberg fails
- **File Processing**: Failed files moved to `error/` prefix for manual review
- **Job Retry**: Environment-specific (dev: 0, uat: 2, prod: 3)

## Data Management

### Seed Data
Sample data is automatically deployed from `data/seeds/` to the raw bucket:
- Assets, sensors, readings, alerts, maintenance events
- CSV format converted to Parquet in curated bucket
- Located at `s3://datalake-raw-{account}-{region}/input/{datatype}/`

### Querying Data
Use the provided SQL templates in `sql/external_tables.sql` to create Athena tables:
```sql
-- Replace {account} and {region} with your values
CREATE EXTERNAL TABLE assets (...)
LOCATION 's3://datalake-curated-{account}-{region}/external/assets/';
```

## Operations Runbook

### Reprocessing Failed Files
```bash
# Move files from error/ back to input/ for reprocessing
aws s3 mv s3://datalake-raw-{account}-{region}/error/{datatype}/ \
         s3://datalake-raw-{account}-{region}/input/{datatype}/ --recursive

# Trigger Glue job manually
aws glue start-job-run --job-name datalake-iceberg-transform-job
```

### Backfill Historical Data
```bash
# Upload historical files to input prefix
aws s3 cp historical_data.csv s3://datalake-raw-{account}-{region}/input/{datatype}/

# Run job with increased timeout for large datasets
aws glue start-job-run --job-name datalake-iceberg-transform-job \
    --arguments '{"--timeout":"480"}'
```

### Rollback Data
```bash
# For Iceberg tables - time travel to previous snapshot
# Query in Athena:
SELECT * FROM table_name FOR SYSTEM_TIME AS OF TIMESTAMP '2024-01-01 12:00:00'

# For external tables - restore from S3 versioning
aws s3api list-object-versions --bucket datalake-curated-{account}-{region} \
    --prefix external/{datatype}/

# Restore specific version
aws s3api restore-object --bucket datalake-curated-{account}-{region} \
    --key external/{datatype}/file.parquet --version-id {version-id}
```

### Emergency Procedures
```bash
# Stop running Glue job
aws glue batch-stop-job-run --job-name datalake-iceberg-transform-job \
    --job-run-ids {run-id}

# Clear input directory to prevent processing
aws s3 rm s3://datalake-raw-{account}-{region}/input/ --recursive

# Check job status and logs
aws glue get-job-runs --job-name datalake-iceberg-transform-job --max-items 5
```

## Commands

* `npm run build`   - Compile TypeScript to JavaScript
* `npm run watch`   - Watch for changes and compile
* `npm run test`    - Run Jest unit tests
* `npm run clean`   - Remove compiled JS/TS files
* `npx cdk deploy`  - Deploy stack to default AWS account/region
* `npx cdk diff`    - Compare deployed stack with current state
* `npx cdk synth`   - Generate CloudFormation template