-- Initialize database with extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create development and test databases
CREATE DATABASE seo_portal_dev;
CREATE DATABASE seo_portal_test;

-- Create analytics read-only user
CREATE USER analytics_reader WITH PASSWORD 'analytics123';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE seo_portal TO postgres;
GRANT ALL PRIVILEGES ON DATABASE seo_portal_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE seo_portal_test TO postgres;

-- Grant read-only access to analytics user
GRANT CONNECT ON DATABASE seo_portal TO analytics_reader;

-- Connect to main database to set up schema permissions
\c seo_portal;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_reader;

-- Set up performance configurations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = all;

-- Log completion
SELECT 'SEO Portal database initialized successfully' as initialization_status;