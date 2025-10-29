-- External Tables DDL for Athena
-- Replace {account} and {region} with your AWS account ID and region

CREATE EXTERNAL TABLE IF NOT EXISTS assets (
  asset_id string,
  asset_name string,
  asset_type string,
  location string,
  installation_date string
)
STORED AS PARQUET
LOCATION 's3://datalake-curated-{account}-{region}/external/assets/';

CREATE EXTERNAL TABLE IF NOT EXISTS sensors (
  sensor_id string,
  asset_id string,
  sensor_type string,
  unit string,
  calibration_date string
)
STORED AS PARQUET
LOCATION 's3://datalake-curated-{account}-{region}/external/sensors/';

CREATE EXTERNAL TABLE IF NOT EXISTS readings (
  reading_id string,
  sensor_id string,
  timestamp string,
  value double,
  quality string,
  year int,
  month int
)
PARTITIONED BY (year int, month int)
STORED AS PARQUET
LOCATION 's3://datalake-curated-{account}-{region}/external/readings/';

CREATE EXTERNAL TABLE IF NOT EXISTS alerts (
  alert_id string,
  sensor_id string,
  alert_type string,
  severity string,
  timestamp string,
  message string
)
STORED AS PARQUET
LOCATION 's3://datalake-curated-{account}-{region}/external/alerts/';

CREATE EXTERNAL TABLE IF NOT EXISTS maintenance_events (
  work_id string,
  asset_id string,
  work_type string,
  scheduled_date string,
  completed_date string,
  technician string,
  notes string
)
STORED AS PARQUET
LOCATION 's3://datalake-curated-{account}-{region}/external/maintenance_events/';

-- Repair partitions for readings table
MSCK REPAIR TABLE readings;