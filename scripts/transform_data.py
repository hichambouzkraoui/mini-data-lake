import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import year, month, col
import boto3

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'RAW_BUCKET', 'CURATED_BUCKET', 'DATABASE_NAME', 'TABLE_FORMAT'])
glueContext = GlueContext(SparkContext())
job = Job(glueContext)
job.init(args['JOB_NAME'], args)
spark = glueContext.spark_session

raw_bucket, curated_bucket, db = args['RAW_BUCKET'], args['CURATED_BUCKET'], args['DATABASE_NAME']
table_format = args.get('TABLE_FORMAT', 'iceberg')
s3 = boto3.client('s3')

def read_data(table):
    return glueContext.create_dynamic_frame.from_options(
        format_options={"quoteChar": "\"", "withHeader": True, "separator": ","},
        connection_type="s3", format="csv",
        connection_options={"paths": [f"s3://{raw_bucket}/input/{table}/"], "recurse": True}
    ).toDF()

def upsert_table(table, pk, df):
    if table == 'readings':
        df = df.withColumn("year", year(col("timestamp"))).withColumn("month", month(col("timestamp")))
    
    df = df.dropDuplicates([pk])
    
    if table_format == 'external':
        # External table: write as Parquet to curated bucket
        s3_path = f"s3://{curated_bucket}/external/{table}/"
        if table == 'readings':
            df.write.mode('overwrite').partitionBy('year', 'month').parquet(s3_path)
        else:
            df.write.mode('overwrite').parquet(s3_path)
        print(f"Written {table} as external table")
    else:
        # Iceberg table (default)
        df.createOrReplaceTempView(f"source_{table}")
        table_path = f"glue_catalog.{db}.{table}"
        
        try:
            table_exists = any(t.name == table for t in spark.catalog.listTables(db))
        except:
            table_exists = False
        
        if not table_exists:
            try:
                writer = df.writeTo(table_path).tableProperty("format-version", "2")
                if table == 'readings':
                    writer = writer.partitionedBy('year', 'month')
                writer.create()
            except Exception as e:
                if "already exists" not in str(e):
                    raise e
                table_exists = True
        
        if table_exists:
            spark.sql(f"""
                MERGE INTO {table_path} t USING source_{table} s ON t.{pk} = s.{pk}
                WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *
            """)

def move_files(table, success=True):
    prefix = f'input/{table}/'
    dest_prefix = f'{"processed" if success else "error"}/{table}/'
    
    try:
        for obj in s3.list_objects_v2(Bucket=raw_bucket, Prefix=prefix).get('Contents', []):
            if obj['Key'].endswith('.csv'):
                source_key = obj['Key']
                dest_key = source_key.replace(prefix, dest_prefix, 1)
                s3.copy_object(Bucket=raw_bucket, CopySource={'Bucket': raw_bucket, 'Key': source_key}, Key=dest_key)
                s3.delete_object(Bucket=raw_bucket, Key=source_key)
    except:
        pass

tables = {'assets': 'asset_id', 'sensors': 'sensor_id', 'readings': 'reading_id', 
          'alerts': 'alert_id', 'maintenance_events': 'work_id'}

for table, pk in tables.items():
    try:
        print(f"Processing {table}")
        df = read_data(table)
        if df.count() > 0:
            upsert_table(table, pk, df)
            move_files(table, True)
            print(f"Completed {table} ({table_format} format)")
        else:
            print(f"No data for {table}")
    except Exception as e:
        print(f"Error processing {table}: {e}")
        move_files(table, False)

job.commit()