# Mini Data Lake

A CDK TypeScript project that creates a secure data lake infrastructure with encrypted S3 buckets for raw and curated data.

## Architecture

- **DataLakeStorage**: Creates KMS-encrypted S3 buckets for raw and curated data with versioning and public access blocking

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
