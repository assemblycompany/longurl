-- LongURL Database Setup (Updated Schema)
-- Run this in your Supabase SQL Editor
-- 
-- Uses modern naming for URL management framework:
-- • endpoints table (more appropriate than short_urls)
-- • url_slug (the public path segment) 
-- • url_base (what it resolves to - external URL or internal route)

-- Main table for URL endpoints
CREATE TABLE IF NOT EXISTS endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  url_base TEXT NOT NULL,
  qr_code TEXT,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by url_slug
CREATE INDEX IF NOT EXISTS idx_endpoints_url_slug ON endpoints(url_slug);

-- Index for entity queries
CREATE INDEX IF NOT EXISTS idx_endpoints_entity ON endpoints(entity_type, entity_id);

-- Optional: Analytics table for detailed click tracking
CREATE TABLE IF NOT EXISTS url_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT REFERENCES endpoints(url_slug) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_url_analytics_url_slug ON url_analytics(url_slug);
CREATE INDEX IF NOT EXISTS idx_url_analytics_timestamp ON url_analytics(timestamp);

-- Optional: RPC function for atomic click counting
CREATE OR REPLACE FUNCTION increment_click_count(url_slug_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE endpoints 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE url_slug = url_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
CREATE POLICY "Enable all operations for service role" ON endpoints
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON url_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users (adjust as needed)
GRANT ALL ON endpoints TO authenticated;
GRANT ALL ON url_analytics TO authenticated;
GRANT USAGE ON SEQUENCE endpoints_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE url_analytics_id_seq TO authenticated; 