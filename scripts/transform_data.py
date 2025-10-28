import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'RAW_BUCKET', 'CURATED_BUCKET', 'DATABASE_NAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read data from raw bucket
raw_path = f"s3://{args['RAW_BUCKET']}/data/"
df = spark.read.option("header", "true").csv(raw_path)

# Basic transformation - add processing timestamp
from pyspark.sql.functions import current_timestamp
df_transformed = df.withColumn("processed_at", current_timestamp())

# Write to curated bucket as Iceberg table
curated_path = f"s3://{args['CURATED_BUCKET']}/iceberg/"
df_transformed.writeTo(f"glue_catalog.{args['DATABASE_NAME']}.transformed_data") \
    .using("iceberg") \
    .createOrReplace()

job.commit()