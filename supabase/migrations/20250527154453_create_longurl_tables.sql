-- Main table for storing shortened URLs
CREATE TABLE IF NOT EXISTS short_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by url_id
CREATE INDEX IF NOT EXISTS idx_short_urls_url_id ON short_urls(url_id);

-- Index for entity queries
CREATE INDEX IF NOT EXISTS idx_short_urls_entity ON short_urls(entity_type, entity_id);

-- Optional: Analytics table for detailed click tracking
CREATE TABLE IF NOT EXISTS url_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT REFERENCES short_urls(url_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_url_analytics_url_id ON url_analytics(url_id);
CREATE INDEX IF NOT EXISTS idx_url_analytics_timestamp ON url_analytics(timestamp);

-- Optional: RPC function for atomic click counting
CREATE OR REPLACE FUNCTION increment_click_count(url_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE short_urls 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE url_id = url_id_param;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
CREATE POLICY "Enable all operations for service role" ON short_urls
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON url_analytics
  FOR ALL USING (auth.role() = 'service_role');
