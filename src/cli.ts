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

/**
 * Process entities of a specific type and generate URL IDs for them.
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
  const supabase = createClient(dbConfig.connection.url, dbConfig.connection.key);
  
  console.log(`Fetching ${entityType} entities without URL IDs (limit: ${limit})...`);
  
  const { data: entities, error } = await supabase
    .from(tableName)
    .select(`${primaryKey}, ${urlIdColumn}`)
    .is(urlIdColumn, null)
    .limit(limit);
  
  if (error) {
    console.error(`Error fetching ${entityType} entities:`, error);
    return { success: 0, failed: 0, total: 0 };
  }
  
  if (!entities || entities.length === 0) {
    console.log(`No ${entityType} entities found without URL IDs`);
    return { success: 0, failed: 0, total: 0 };
  }
  
  console.log(`Found ${entities.length} ${entityType} entities without URL IDs`);
  
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
      const result = await generateUrlId(entityType, entityId.toString(), {}, dbConfig);
      
      if (!result.success || !result.urlId) {
        console.error(`Failed to generate URL ID for ${entityType} ${entityId}: ${result.error}`);
        failed++;
        continue;
      }
      
      const urlId = result.urlId;
      console.log(`Generated URL ID ${urlId} for ${entityType} ${entityId}`);
      
      if (!dryRun) {
        if (dbConfig.strategy === StorageStrategy.LOOKUP_TABLE) {
          const lookupTable = dbConfig.lookupTable || 'short_urls';
          
          const { error: insertError } = await supabase
            .from(lookupTable)
            .insert({
              url_id: urlId,
              entity_id: entityId,
              entity_type: entityType,
              original_url: `/${entityType}/${entityId}`,
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
 * Main CLI function with conditional environment loading
 */
async function main() {
  const args = process.argv.slice(2);
  
  // ✅ Help works instantly - no environment loading needed
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: longurl-cli <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  generate <entity-type> <table-name> <primary-key> [limit] [--dry-run]');
    console.log('    Generate URL IDs for entities in a specific table');
    console.log('  test <entity-type> <entity-id> [domain] [--framework]');
    console.log('    Test URL generation for a single entity (no database required)');
    console.log('');
    console.log('Examples:');
    console.log('  longurl-cli generate product products id 50');
    console.log('  longurl-cli generate customer customers customer_id 100 --dry-run');
    console.log('  longurl-cli test product laptop-123');
    console.log('  longurl-cli test user user-456 mysite.com');
    console.log('  longurl-cli test product laptop-dell-xps-13 mystore.co --framework');
    console.log('');
    console.log('Test Mode Options:');
    console.log('  (no flag)     Compare both shortening and framework modes');
    console.log('  --framework   Test only framework mode (readable URLs)');
    console.log('');
    console.log('Environment Variables:');
    console.log('  SUPABASE_URL              Supabase project URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY Service role key for database access');
    return;
  }
  
  const command = args[0];
  const dryRun = args.includes('--dry-run');
  
  if (command === 'generate') {
    // ✅ Only load environment when database is actually needed
    const { initializeDatabaseEnvironment } = await import('./env');
    
    const entityType = args[1];
    const tableName = args[2];
    const primaryKey = args[3];
    const limit = parseInt(args[4]) || 100;
    
    if (!entityType || !tableName || !primaryKey) {
      console.error('Error: entity-type, table-name, and primary-key are required');
      console.error('Usage: longurl-cli generate <entity-type> <table-name> <primary-key> [limit] [--dry-run]');
      process.exit(1);
    }
    
    try {
      const dbConfig = initializeDatabaseEnvironment();
      
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
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
    
  } else if (command === 'test') {
    // ✅ Test command works with zero environment - no database needed
    const entityType = args[1];
    const entityId = args[2];
    const domain = args[3] || 'yourdomain.co';
    const modeFlag = args[4];
    
    if (!entityType || !entityId) {
      console.error('Error: entity-type and entity-id are required');
      console.error('Usage: longurl-cli test <entity-type> <entity-id> [domain] [--framework]');
      console.error('');
      console.error('Options:');
      console.error('  --framework    Test framework mode (readable URLs)');
      console.error('  (default)      Test shortening mode (random IDs)');
      process.exit(1);
    }
    
    const isFrameworkMode = modeFlag === '--framework' || process.env.LONGURL_SHORTEN === 'false';
    
    console.log(`🧪 Testing URL generation (no database required)`);
    console.log(`Entity Type: ${entityType}`);
    console.log(`Entity ID: ${entityId}`);
    console.log(`Domain: ${domain}`);
    console.log(`Mode: ${isFrameworkMode ? 'Framework (readable URLs)' : 'Shortening (random IDs)'}`);
    console.log('');
    
    // Create minimal config for testing (no database operations)
    const testConfig: DatabaseConfig = {
      strategy: StorageStrategy.LOOKUP_TABLE,
      connection: { url: '', key: '' }, // Empty - won't be used for test
      lookupTable: 'short_urls',
      urlIdColumn: 'url_id'
    };
    
    // Test both modes if not specified
    if (!modeFlag) {
      console.log('=== SHORTENING MODE (Traditional) ===');
      const shortenResult = await generateUrlId(entityType, entityId, { 
        domain, 
        enableShortening: true 
      }, testConfig);
      
      if (shortenResult.success) {
        console.log('✅ Shortened URL generated:');
        console.log(`🔗 Short URL: ${shortenResult.shortUrl}`);
        console.log(`🆔 URL ID: ${shortenResult.urlId} (random Base62)`);
        console.log(`📦 url_slug_short: ${shortenResult.url_slug_short || 'N/A'}`);
      } else {
        console.log(`❌ Shortening failed: ${shortenResult.error}`);
      }
      
      console.log('\n=== FRAMEWORK MODE (URL Management) ===');
      const frameworkResult = await generateUrlId(entityType, entityId, { 
        domain, 
        enableShortening: false 
      }, testConfig);
      
      if (frameworkResult.success) {
        console.log('✅ Framework URL generated:');
        console.log(`🔗 Managed URL: ${frameworkResult.shortUrl}`);
        console.log(`🆔 URL ID (url_slug): ${frameworkResult.urlId} (readable entity ID)`);
        console.log(`📦 url_slug_short: ${frameworkResult.url_slug_short || 'N/A'} (random Base62 for sharing)`);
        console.log(`🔑 publicId: ${frameworkResult.publicId || 'N/A'}`);
      } else {
        console.log(`❌ Framework mode failed: ${frameworkResult.error}`);
      }
      
      console.log('\n=== COMPARISON ===');
      if (shortenResult.success && frameworkResult.success) {
        console.log(`Shortening: ${shortenResult.shortUrl}`);
        console.log(`Framework:  ${frameworkResult.shortUrl}`);
      }
      
      console.log('\n=== ENVIRONMENT CONTROL ===');
      console.log('Set LONGURL_SHORTEN=false to enable framework mode globally');
      console.log('export LONGURL_SHORTEN=false');
      
    } else {
      // Test specific mode
      const result = await generateUrlId(entityType, entityId, { 
        domain, 
        enableShortening: !isFrameworkMode 
      }, testConfig);
    
    if (result.success) {
      console.log('✅ URL generated successfully!');
      console.log(`🔗 ${isFrameworkMode ? 'Managed' : 'Short'} URL: ${result.shortUrl}`);
      console.log(`🆔 URL ID (url_slug): ${result.urlId}`);
      if (result.url_slug_short) {
        console.log(`📦 url_slug_short: ${result.url_slug_short}`);
      }
      if (result.publicId && result.publicId !== result.urlId) {
        console.log(`🔑 publicId: ${result.publicId}`);
      }
    } else {
      console.log(`❌ Generation failed: ${result.error}`);
    }
    }
    
    console.log('\n💡 This demonstrates the URL structure your app would generate.');
    console.log('   Add database tables to enable collision detection and persistence.');
    
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