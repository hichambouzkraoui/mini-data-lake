#!/bin/bash

# Deploy script for different environments
# Usage: ./scripts/deploy.sh [environment] [aws-profile]

ENVIRONMENT=${1:-dev}
AWS_PROFILE=${2:-default}

echo "Deploying to environment: $ENVIRONMENT"
echo "Using AWS profile: $AWS_PROFILE"

# Deploy the stack
npx cdk deploy --context environment=$ENVIRONMENT --profile $AWS_PROFILE --require-approval never

echo "Deployment completed for $ENVIRONMENT environment"