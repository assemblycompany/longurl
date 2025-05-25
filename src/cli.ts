#!/usr/bin/env node

/**
 * CLI tool for batch generating URLs for existing entities.
 * 
 * This utility helps in generating and updating URL IDs
 * for entities that already exist in the database.
 */

import { createClient } from '@supabase/supabase-js';
import { generateUrlId } from './generator';
import { DatabaseConfig, StorageStrategy } from '../types';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { existsSync } from 'fs';

// Initialize environment
const loadEnv = () => {
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
};

loadEnv();

// Get Supabase client from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not configured');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Process entities of a specific type and generate URL IDs for them.
 * 
 * @param entityType Type of entity to process
 * @param tableName Database table name
 * @param primaryKey Primary key column name
 * @param dbConfig Database configuration
 * @param limit Max number of entities to process in one batch
 * @param dryRun If true, don't actually update the database
 */
async function processEntityType(
  entityType: string,
  tableName: string,
  primaryKey: string,
  dbConfig: DatabaseConfig,
  limit: number = 100,
  dryRun: boolean = false
): Promise<{ success: number; failed: number; total: number }> {
  console.log(`\nProcessing ${entityType} entities...`);
  
  const urlIdColumn = dbConfig.urlIdColumn || 'url_id';
  
  // Fetch entities without URL IDs
  console.log(`Fetching ${entityType} entities without URL IDs (limit: ${limit})...`);
  
  let query = supabase
    .from(tableName)
    .select(`${primaryKey}, ${urlIdColumn}`)
    .is(urlIdColumn, null)
    .limit(limit);
  
  const { data: entities, error } = await query;
  
  if (error) {
    console.error(`Error fetching ${entityType} entities:`, error);
    return { success: 0, failed: 0, total: 0 };
  }
  
  if (!entities || entities.length === 0) {
    console.log(`No ${entityType} entities found without URL IDs`);
    return { success: 0, failed: 0, total: 0 };
  }
  
  console.log(`Found ${entities.length} ${entityType} entities without URL IDs`);
  
  // Process each entity
  let success = 0;
  let failed = 0;
  
  for (const entity of entities) {
    const entityId = entity[primaryKey as keyof typeof entity];
    
    if (!entityId) {
      console.error(`Entity is missing ${primaryKey}, skipping`);
      failed++;
      continue;
    }
    
    console.log(`Processing ${entityType} with ID: ${entityId}`);
    
    try {
      // Generate URL ID
      const result = await generateUrlId(entityType, entityId.toString(), {}, dbConfig);
      
      if (!result.success || !result.urlId) {
        console.error(`Failed to generate URL ID for ${entityType} ${entityId}: ${result.error}`);
        failed++;
        continue;
      }
      
      const urlId = result.urlId;
      console.log(`Generated URL ID ${urlId} for ${entityType} ${entityId}`);
      
      // Update the entity with the URL ID
      if (!dryRun) {
        if (dbConfig.strategy === StorageStrategy.LOOKUP_TABLE) {
          // Insert into lookup table
          const lookupTable = dbConfig.lookupTable || 'short_urls';
          
          const { error: insertError } = await supabase
            .from(lookupTable)
            .insert({
              url_id: urlId,
              entity_id: entityId,
              entity_type: entityType,
              original_url: `/${entityType}/${entityId}`, // Default URL pattern
              click_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`Error updating lookup table for ${entityType} ${entityId}:`, insertError);
            failed++;
            continue;
          }
        } else {
          // Update entity table directly
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ [urlIdColumn]: urlId })
            .eq(primaryKey, entityId);
          
          if (updateError) {
            console.error(`Error updating ${entityType} ${entityId}:`, updateError);
            failed++;
            continue;
          }
        }
        
        console.log(`Updated ${entityType} ${entityId} with URL ID ${urlId}`);
      } else {
        console.log(`[DRY RUN] Would update ${entityType} ${entityId} with URL ID ${urlId}`);
      }
      
      success++;
    } catch (error) {
      console.error(`Error processing ${entityType} ${entityId}:`, error);
      failed++;
    }
  }
  
  return { success, failed, total: entities.length };
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: longurl-cli <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate <entity-type> <table-name> <primary-key> [limit] [--dry-run]');
    console.log('    Generate URL IDs for entities in a specific table');
    console.log('');
    console.log('Examples:');
    console.log('  longurl-cli generate product products id 50');
    console.log('  longurl-cli generate user users user_id 100 --dry-run');
    return;
  }
  
  const command = args[0];
  const dryRun = args.includes('--dry-run');
  
  // Database configuration
  const dbConfig: DatabaseConfig = {
    strategy: StorageStrategy.LOOKUP_TABLE,
    connection: {
      url: supabaseUrl!,
      key: supabaseKey!
    },
    lookupTable: 'short_urls',
    urlIdColumn: 'url_id'
  };
  
  if (command === 'generate') {
    const entityType = args[1];
    const tableName = args[2];
    const primaryKey = args[3];
    const limit = parseInt(args[4]) || 100;
    
    if (!entityType || !tableName || !primaryKey) {
      console.error('Error: entity-type, table-name, and primary-key are required');
      console.error('Usage: longurl-cli generate <entity-type> <table-name> <primary-key> [limit] [--dry-run]');
      process.exit(1);
    }
    
    console.log(`Starting URL ID generation for ${entityType} entities...`);
    console.log(`Table: ${tableName}`);
    console.log(`Primary Key: ${primaryKey}`);
    console.log(`Limit: ${limit}`);
    console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}`);
    console.log('');
    
    const result = await processEntityType(entityType, tableName, primaryKey, dbConfig, limit, dryRun);
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total entities processed: ${result.total}`);
    console.log(`Successfully generated: ${result.success}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.failed > 0) {
      process.exit(1);
    }
  } else {
    console.error(`Error: Unknown command "${command}"`);
    console.error('Run without arguments to see usage information');
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Error running CLI:', error);
  process.exit(1);
}); 