-- Create live_pitch user with password and permissions
CREATE ROLE live_pitch WITH LOGIN PASSWORD 'password123' CREATEDB;

-- Grant privileges to live_pitch
GRANT ALL PRIVILEGES ON DATABASE matches_db TO live_pitch;

-- Create schema for live_pitch
ALTER ROLE live_pitch SET search_path TO public;