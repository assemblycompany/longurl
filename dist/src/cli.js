#!/usr/bin/env node
"use strict";
/**
 * CLI tool for batch generating URLs for existing entities.
 *
 * This utility helps in generating and updating URL IDs
 * for entities that already exist in the database.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const generator_1 = require("./generator");
const types_1 = require("../types");
/**
 * Process entities of a specific type and generate URL IDs for them.
 */
async function processEntityType(entityType, tableName, primaryKey, dbConfig, limit = 100, dryRun = false) {
    console.log(`\nProcessing ${entityType} entities...`);
    const urlIdColumn = dbConfig.urlIdColumn || 'url_id';
    const supabase = (0, supabase_js_1.createClient)(dbConfig.connection.url, dbConfig.connection.key);
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
        const entityId = entity[primaryKey];
        if (!entityId) {
            console.error(`Entity is missing ${primaryKey}, skipping`);
            failed++;
            continue;
        }
        console.log(`Processing ${entityType} with ID: ${entityId}`);
        try {
            const result = await (0, generator_1.generateUrlId)(entityType, entityId.toString(), {}, dbConfig);
            if (!result.success || !result.urlId) {
                console.error(`Failed to generate URL ID for ${entityType} ${entityId}: ${result.error}`);
                failed++;
                continue;
            }
            const urlId = result.urlId;
            console.log(`Generated URL ID ${urlId} for ${entityType} ${entityId}`);
            if (!dryRun) {
                if (dbConfig.strategy === types_1.StorageStrategy.LOOKUP_TABLE) {
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
                }
                else {
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
            }
            else {
                console.log(`[DRY RUN] Would update ${entityType} ${entityId} with URL ID ${urlId}`);
            }
            success++;
        }
        catch (error) {
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
        console.log('  test <entity-type> <entity-id> [domain]');
        console.log('    Test URL generation for a single entity (no database required)');
        console.log('');
        console.log('Examples:');
        console.log('  longurl-cli generate product products id 50');
        console.log('  longurl-cli generate customer customers customer_id 100 --dry-run');
        console.log('  longurl-cli test product laptop-123');
        console.log('  longurl-cli test user user-456 mysite.com');
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
        const { initializeDatabaseEnvironment } = await Promise.resolve().then(() => __importStar(require('./env')));
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
        }
        catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    else if (command === 'test') {
        // ✅ Test command works with zero environment - no database needed
        const entityType = args[1];
        const entityId = args[2];
        const domain = args[3] || 'yourdomain.co';
        if (!entityType || !entityId) {
            console.error('Error: entity-type and entity-id are required');
            console.error('Usage: longurl-cli test <entity-type> <entity-id> [domain]');
            process.exit(1);
        }
        console.log(`🧪 Testing URL generation (no database required)`);
        console.log(`Entity Type: ${entityType}`);
        console.log(`Entity ID: ${entityId}`);
        console.log(`Domain: ${domain}`);
        console.log('');
        // Create minimal config for testing (no database operations)
        const testConfig = {
            strategy: types_1.StorageStrategy.LOOKUP_TABLE,
            connection: { url: '', key: '' }, // Empty - won't be used for test
            lookupTable: 'short_urls',
            urlIdColumn: 'url_id'
        };
        const result = await (0, generator_1.generateUrlId)(entityType, entityId, { domain }, testConfig);
        if (result.success) {
            console.log('✅ URL generated successfully!');
            console.log(`🔗 Short URL: ${result.shortUrl}`);
            console.log(`🆔 URL ID: ${result.urlId}`);
            console.log('');
            console.log('💡 This demonstrates the URL structure your app would generate.');
            console.log('   Add database tables to enable collision detection and persistence.');
        }
        else {
            console.log(`❌ Generation failed: ${result.error}`);
        }
    }
    else {
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
