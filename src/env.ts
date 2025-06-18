/**
 * Environment and Database Configuration
 * 
 * This module handles environment loading and Supabase configuration.
 * Only imported when database operations are needed.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { existsSync } from 'fs';
import { DatabaseConfig, StorageStrategy } from '../types';

/**
 * Load environment variables from various possible locations
 */
export function loadEnvironment(): void {
  // Try different possible locations for .env file
  const envPaths = [
    '.env',
    '.env.local',
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../../.env.local')
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      console.log(`Loading environment from ${envPath}`);
      dotenv.config({ path: envPath });
      break;
    }
  }
}

/**
 * Get Supabase configuration from environment variables
 * Throws error if not properly configured
 */
export function getSupabaseConfig(): { url: string; key: string } {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or key not configured.\n' +
      'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return { url: supabaseUrl, key: supabaseKey };
}

/**
 * Create database configuration for CLI operations
 */
export function createDatabaseConfig(): DatabaseConfig {
  const { url, key } = getSupabaseConfig();
  
  return {
    strategy: StorageStrategy.LOOKUP_TABLE,
    connection: { url, key },
    lookupTable: process.env.LONGURL_TABLE_NAME || 'short_urls',
    urlIdColumn: 'url_id'
  };
}

/**
 * Initialize environment and return database config
 * Call this only when database operations are needed
 */
export function initializeDatabaseEnvironment(): DatabaseConfig {
  loadEnvironment();
  return createDatabaseConfig();
} 