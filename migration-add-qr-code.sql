-- LongURL QR Code Migration Script
-- Run this in your Supabase SQL Editor to add QR code support
-- 
-- This script adds the qr_code column to existing endpoints tables
-- for users upgrading to LongURL 0.3.6+

-- Add QR code column to endpoints table
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Verify the migration was successful
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'endpoints' 
  AND column_name = 'qr_code';

-- Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'endpoints' 
ORDER BY ordinal_position;

-- Migration complete! 
-- Your database now supports QR code storage.
-- 
-- New URLs will automatically generate QR codes and store them
-- in the qr_code column as base64 data URLs.
-- 
-- Existing URLs will have NULL in the qr_code column until
-- they are regenerated or updated. 