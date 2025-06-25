-- Migration: From short_urls to endpoints table
-- Run this in your Supabase SQL Editor to migrate existing data

-- ========================================
-- BACKUP WARNING: Always backup your data before running migrations!
-- ========================================

BEGIN;

-- Step 1: Create new endpoints table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  url_base TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate data from short_urls to endpoints (if short_urls exists)
INSERT INTO endpoints (id, url_slug, entity_type, entity_id, url_base, click_count, metadata, created_at, updated_at)
SELECT id, url_id, entity_type, entity_id, original_url, click_count, metadata, created_at, updated_at
FROM short_urls
ON CONFLICT (url_slug) DO NOTHING;  -- Skip duplicates

-- Step 3: Create indexes for endpoints table
CREATE INDEX IF NOT EXISTS idx_endpoints_url_slug ON endpoints(url_slug);
CREATE INDEX IF NOT EXISTS idx_endpoints_entity ON endpoints(entity_type, entity_id);

-- Step 4: Update analytics table to reference endpoints
-- First add the new column if it doesn't exist
ALTER TABLE url_analytics ADD COLUMN IF NOT EXISTS url_slug_new TEXT;

-- Copy url_id values to url_slug_new
UPDATE url_analytics SET url_slug_new = url_id WHERE url_slug_new IS NULL;

-- Drop old constraint if it exists
ALTER TABLE url_analytics DROP CONSTRAINT IF EXISTS url_analytics_url_id_fkey;

-- Add new foreign key constraint
ALTER TABLE url_analytics ADD CONSTRAINT url_analytics_url_slug_fkey 
  FOREIGN KEY (url_slug_new) REFERENCES endpoints(url_slug) ON DELETE CASCADE;

-- Step 5: Update RPC function to use endpoints table
CREATE OR REPLACE FUNCTION increment_click_count(url_slug_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE endpoints 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE url_slug = url_slug_param;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update analytics indexes
CREATE INDEX IF NOT EXISTS idx_url_analytics_url_slug_new ON url_analytics(url_slug_new);

COMMIT;

-- ========================================
-- Migration completed!
-- 
-- What happened:
-- 1. Created new 'endpoints' table with modern naming
-- 2. Migrated all data from 'short_urls' (if it existed)
-- 3. Updated analytics table to reference new structure
-- 4. Your adapter will automatically detect and use the new table
-- 
-- Note: Your old 'short_urls' table is preserved for safety.
-- You can drop it manually after confirming everything works:
-- DROP TABLE short_urls CASCADE;
-- ======================================== 