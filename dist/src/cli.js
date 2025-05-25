#!/usr/bin/env node
"use strict";
/**
 * CLI tool for batch generating opaque URLs for existing entities.
 *
 * This utility helps in generating and updating opaque URL IDs
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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const generator_1 = require("./generator");
const types_1 = require("../types");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
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
        if ((0, fs_1.existsSync)(envPath)) {
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
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
/**
 * Process all entities of a specific type and generate URL IDs for them.
 *
 * @param entityType Type of entity to process
 * @param dbConfig Database configuration
 * @param limit Max number of entities to process in one batch
 * @param dryRun If true, don't actually update the database
 */
async function processEntityType(entityType, dbConfig, limit = 100, dryRun = false) {
    console.log(`\nProcessing ${entityType} entities...`);
    // Get table name based on entity type
    const tableName = getTableFromEntityType(entityType);
    const idColumn = getPrimaryKeyForEntityType(entityType);
    const urlIdColumn = dbConfig.urlIdColumn || 'url_id';
    // Fetch entities without URL IDs
    console.log(`Fetching ${entityType} entities without URL IDs (limit: ${limit})...`);
    let query = supabase
        .from(tableName)
        .select(`${idColumn}, ${urlIdColumn}`)
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
        const entityId = entity[idColumn];
        if (!entityId) {
            console.error(`Entity is missing ${idColumn}, skipping`);
            failed++;
            continue;
        }
        console.log(`Processing ${entityType} with ID: ${entityId}`);
        try {
            // Generate URL ID
            const result = await (0, generator_1.generateUrlId)(entityType, entityId.toString(), undefined, dbConfig);
            if (!result.success || !result.urlId) {
                console.error(`Failed to generate URL ID for ${entityType} ${entityId}: ${result.error}`);
                failed++;
                continue;
            }
            const urlId = result.urlId;
            console.log(`Generated URL ID ${urlId} for ${entityType} ${entityId}`);
            // Update the entity with the URL ID
            if (!dryRun) {
                if (dbConfig.strategy === types_1.StorageStrategy.LOOKUP_TABLE) {
                    // Insert into lookup table
                    const lookupTable = dbConfig.lookupTable || 'opaque_urls';
                    const { error: insertError } = await supabase
                        .from(lookupTable)
                        .insert({
                        url_id: urlId,
                        entity_id: entityId,
                        entity_type: entityType
                    });
                    if (insertError) {
                        console.error(`Error updating lookup table for ${entityType} ${entityId}:`, insertError);
                        failed++;
                        continue;
                    }
                }
                else {
                    // Update entity table directly
                    const { error: updateError } = await supabase
                        .from(tableName)
                        .update({ [urlIdColumn]: urlId })
                        .eq(idColumn, entityId);
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
 * Get table name for entity type
 */
function getTableFromEntityType(entityType) {
    switch (entityType) {
        case types_1.EntityType.INSIDER:
            return 'insiders';
        case types_1.EntityType.COMPANY:
            return 'companies';
        case types_1.EntityType.FILING:
            return 'filings';
        case types_1.EntityType.USER:
            return 'users';
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}
/**
 * Get primary key column for entity type
 */
function getPrimaryKeyForEntityType(entityType) {
    switch (entityType) {
        case types_1.EntityType.INSIDER:
            return 'insider_id';
        case types_1.EntityType.COMPANY:
            return 'company_id';
        case types_1.EntityType.FILING:
            return 'id';
        case types_1.EntityType.USER:
            return 'id';
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}
// Parse command line arguments
const args = process.argv.slice(2);
const entityTypeArg = args.find(arg => Object.values(types_1.EntityType).includes(arg));
const limitArg = args.find(arg => arg.startsWith('--limit='));
const dryRunArg = args.includes('--dry-run');
const allArg = args.includes('--all');
const helpArg = args.includes('--help') || args.includes('-h');
// Parse the limit value
const limit = limitArg
    ? parseInt(limitArg.split('=')[1], 10)
    : 100;
// Configuration
const dbConfig = {
    strategy: args.includes('--lookup-table')
        ? types_1.StorageStrategy.LOOKUP_TABLE
        : types_1.StorageStrategy.INLINE,
    lookupTable: ((_a = args.find(arg => arg.startsWith('--table='))) === null || _a === void 0 ? void 0 : _a.split('=')[1]) || 'opaque_urls',
    urlIdColumn: ((_b = args.find(arg => arg.startsWith('--column='))) === null || _b === void 0 ? void 0 : _b.split('=')[1]) || 'url_id'
};
// Show help
if (helpArg) {
    console.log(`
Opaque URL Generator CLI

Usage:
  npx ts-node cli.ts [entity_type] [options]

Entity Types:
  ${Object.values(types_1.EntityType).join(', ')}

Options:
  --all                Process all entity types
  --limit=<number>     Maximum number of entities to process (default: 100)
  --dry-run            Don't actually update the database
  --lookup-table       Use lookup table strategy instead of inline
  --table=<name>       Name of lookup table (default: opaque_urls)
  --column=<name>      Name of URL ID column (default: url_id)
  --help, -h           Show this help message

Examples:
  npx ts-node cli.ts insider --limit=50
  npx ts-node cli.ts company --dry-run
  npx ts-node cli.ts --all --lookup-table --table=entity_urls
  `);
    process.exit(0);
}
/**
 * Main function to run the CLI
 */
async function main() {
    console.log('Opaque URL Generator CLI');
    console.log('========================');
    console.log('Configuration:');
    console.log(`- Database strategy: ${dbConfig.strategy}`);
    if (dbConfig.strategy === types_1.StorageStrategy.LOOKUP_TABLE) {
        console.log(`- Lookup table: ${dbConfig.lookupTable}`);
    }
    else {
        console.log(`- URL ID column: ${dbConfig.urlIdColumn}`);
    }
    console.log(`- Processing limit: ${limit}`);
    console.log(`- Dry run: ${dryRunArg ? 'Yes' : 'No'}`);
    const results = {
        success: 0,
        failed: 0,
        total: 0
    };
    if (allArg) {
        // Process all entity types
        for (const type of Object.values(types_1.EntityType)) {
            const result = await processEntityType(type, dbConfig, limit, dryRunArg);
            results.success += result.success;
            results.failed += result.failed;
            results.total += result.total;
        }
    }
    else if (entityTypeArg) {
        // Process specific entity type
        const entityType = entityTypeArg;
        const result = await processEntityType(entityType, dbConfig, limit, dryRunArg);
        results.success += result.success;
        results.failed += result.failed;
        results.total += result.total;
    }
    else {
        console.error('Error: No entity type specified');
        console.error('Use --help for usage information');
        process.exit(1);
    }
    // Summary
    console.log('\nSummary:');
    console.log(`- Total entities processed: ${results.total}`);
    console.log(`- Successfully updated: ${results.success}`);
    console.log(`- Failed: ${results.failed}`);
    if (dryRunArg) {
        console.log('\nNote: This was a dry run, no actual changes were made.');
    }
}
// Run the CLI
main().catch(error => {
    console.error('Error running CLI:', error);
    process.exit(1);
});
