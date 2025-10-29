# Mini Data Lake

A CDK TypeScript project that creates a secure data lake infrastructure with encrypted S3 buckets for raw and curated data using Apache Iceberg format.

## Architecture

### Components
- **DataLakeStorage**: KMS-encrypted S3 buckets (raw/curated) with versioning and public access blocking
- **DataCatalog**: AWS Glue Data Catalog for metadata management
- **GlueJob**: ETL job with Iceberg support for data transformation
- **AthenaWorkgroup**: Query engine for analytics with result encryption
- **Monitoring**: CloudWatch logs and metrics collection

### Data Flow
1. Raw data ingested to S3 raw bucket
2. Glue job processes data using Iceberg format
3. Transformed data stored in curated bucket
4. Athena queries curated data through Glue Catalog
5. Failed files moved to error prefix for review

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
npm run watch    # Auto-compile TypeScript
npm test         # Run unit tests
npx cdk diff     # Preview changes
npx cdk synth    # Generate CloudFormation
```

## CI/CD Pipeline

### Environments
- **Dev**: Auto-deploy on PR approval/ready for review
- **UAT**: Auto-deploy on main branch push
- **Prod**: Auto-deploy on version tags (v*)

### Workflows
- **CI**: Runs tests on all PRs and main pushes
- **Deploy**: Multi-environment deployment with OIDC authentication

### Deployment
```bash
# Manual deployment
./scripts/deploy.sh [environment] [aws-profile]

# Environment-specific
npx cdk deploy --context environment=dev
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

## Iceberg Format

### Availability
- **Glue Version**: 4.0 with native Iceberg support
- **Format Version**: 2 (latest) for optimal performance
- **Partitioning**: Time-based partitioning on readings table (year/month)

### Fallbacks
- **Table Creation**: Falls back to standard Spark tables if Iceberg fails
- **File Processing**: Failed files moved to `error/` prefix for manual review
- **Job Retry**: Disabled (maxRetries: 0) to prevent duplicate processing

## Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template