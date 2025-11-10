-- LongURL url_slug_short Migration Script
-- Run this in your Supabase SQL Editor to add short URL slug support
-- 
-- This script adds the url_slug_short column to existing endpoints tables
-- for users upgrading to LongURL 0.3.9+
-- 
-- The url_slug_short column stores a random Base62 ID for easy sharing,
-- allowing both readable slugs and short IDs to resolve to the same destination.

-- Add url_slug_short column to endpoints table
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS url_slug_short TEXT;

-- Create unique index for fast lookups by url_slug_short
CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoints_url_slug_short ON endpoints(url_slug_short) WHERE url_slug_short IS NOT NULL;

-- Verify the migration was successful
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'endpoints' 
  AND column_name = 'url_slug_short';

-- Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'endpoints' 
ORDER BY ordinal_position;

-- Migration complete! 
-- Your database now supports short URL slugs in the same row.
-- 
-- Framework Mode URLs will now store both:
-- - url_slug: The readable slug (e.g., "laptop-pro-2024")
-- - url_slug_short: The short Base62 ID (e.g., "X7gT5p")
-- 
-- Both slugs resolve to the same url_base destination.
-- 
-- Existing URLs will have NULL in the url_slug_short column until
-- they are regenerated or updated.

