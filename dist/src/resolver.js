"use strict";
/**
 * URL Resolver
 *
 * Resolves URL IDs back to their original entities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrlId = resolveUrlId;
exports.clearResolutionCache = clearResolutionCache;
const supabase_js_1 = require("@supabase/supabase-js");
const types_1 = require("../types");
const utils_1 = require("../utils");
// Cache for resolution results to improve performance
const resolutionCache = {};
/**
 * Initialize cache for entity type if it doesn't exist
 */
function initCacheForType(entityType) {
    if (!resolutionCache[entityType]) {
        resolutionCache[entityType] = {};
    }
}
/**
 * Resolve a URL ID to its corresponding entity
 *
 * @param entityType Type of entity (any string)
 * @param urlId The URL ID to resolve
 * @param dbConfig Database configuration
 * @param entityConfig Entity configuration for table mapping
 * @returns Resolution result with entity data
 */
async function resolveUrlId(entityType, urlId, dbConfig = types_1.DEFAULT_DB_CONFIG, entityConfig) {
    try {
        // Input validation
        if (!urlId || !(0, utils_1.isValidUrlId)(urlId)) {
            return {
                success: false,
                error: 'Invalid URL ID format'
            };
        }
        // Initialize cache for this entity type
        initCacheForType(entityType);
        // Check cache first
        if (resolutionCache[entityType][urlId]) {
            return {
                entity: resolutionCache[entityType][urlId],
                entityId: resolutionCache[entityType][urlId][(entityConfig === null || entityConfig === void 0 ? void 0 : entityConfig.primaryKey) || 'id'],
                entityType,
                success: true
            };
        }
        // Get Supabase client from database config
        const supabase = (0, supabase_js_1.createClient)(dbConfig.connection.url, dbConfig.connection.key);
        // Different resolution strategies based on database config
        if (dbConfig.strategy === types_1.StorageStrategy.LOOKUP_TABLE) {
            // Using the lookup table strategy
            const lookupTable = dbConfig.lookupTable || 'short_urls';
            // First, get the entity ID from the lookup table
            const { data: lookupData, error: lookupError } = await supabase
                .from(lookupTable)
                .select('entity_id, entity_type, original_url')
                .eq('url_id', urlId)
                .eq('entity_type', entityType)
                .single();
            if (lookupError || !lookupData) {
                return {
                    success: false,
                    error: lookupError ? lookupError.message : 'URL ID not found'
                };
            }
            // If entity config is provided, fetch the actual entity
            let entity = undefined;
            if (entityConfig && lookupData.entity_id) {
                const { data: entityData, error: entityError } = await supabase
                    .from(entityConfig.tableName)
                    .select('*')
                    .eq(entityConfig.primaryKey, lookupData.entity_id)
                    .single();
                if (!entityError && entityData) {
                    entity = entityData;
                    // Cache the result
                    resolutionCache[entityType][urlId] = entityData;
                }
            }
            return {
                entity: entity,
                entityId: lookupData.entity_id,
                entityType,
                success: true
            };
        }
        else {
            // Using the inline strategy (ID is stored directly in the entity table)
            if (!entityConfig) {
                return {
                    success: false,
                    error: 'Entity configuration required for inline strategy'
                };
            }
            const idColumn = dbConfig.urlIdColumn || 'url_id';
            const { data, error } = await supabase
                .from(entityConfig.tableName)
                .select('*')
                .eq(idColumn, urlId)
                .single();
            if (error || !data) {
                return {
                    success: false,
                    error: error ? error.message : 'URL ID not found'
                };
            }
            // Cache the result
            resolutionCache[entityType][urlId] = data;
            return {
                entity: data,
                entityId: data[entityConfig.primaryKey],
                entityType,
                success: true
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: `Error resolving URL ID: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
/**
 * Clear the resolution cache for a specific entity type or all types
 *
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
function clearResolutionCache(entityType) {
    if (entityType) {
        resolutionCache[entityType] = {};
    }
    else {
        // Clear all cache entries
        Object.keys(resolutionCache).forEach(type => {
            resolutionCache[type] = {};
        });
    }
}
