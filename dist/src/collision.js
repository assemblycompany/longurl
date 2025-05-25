"use strict";
/**
 * Collision detection for URL IDs
 *
 * Handles checking if a generated ID already exists in the database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCollision = checkCollision;
exports.clearCollisionCache = clearCollisionCache;
exports.getCollisionCacheStats = getCollisionCacheStats;
const supabase_js_1 = require("@supabase/supabase-js");
// Caching layer for collision checks to reduce DB queries
const collisionCache = {};
// Cache hit indicators for tracking performance
let cacheHits = 0;
let cacheMisses = 0;
/**
 * Check if a URL ID already exists for the given entity type
 *
 * @param entityType Type of entity (or 'default' for non-entity URLs)
 * @param urlId The URL ID to check
 * @param dbConfig Database configuration
 * @returns True if collision exists, false otherwise
 */
async function checkCollision(entityType, urlId, dbConfig) {
    // Initialize cache for this entity type if it doesn't exist
    if (!collisionCache[entityType]) {
        collisionCache[entityType] = new Set();
    }
    // First check cache for faster responses
    if (collisionCache[entityType].has(urlId)) {
        cacheHits++;
        return true; // ID exists in cache, so there's a collision
    }
    cacheMisses++;
    try {
        // Get Supabase client from database config
        const supabase = (0, supabase_js_1.createClient)(dbConfig.connection.url, dbConfig.connection.key);
        // For the lookup table strategy, always check the main table
        const table = dbConfig.lookupTable || 'short_urls';
        const column = 'url_id';
        // Check if ID exists in the database
        let query = supabase.from(table).select('id').eq(column, urlId);
        // Add entity type filter if it's not the default type
        if (entityType !== 'default') {
            query = query.eq('entity_type', entityType);
        }
        const { data, error } = await query.limit(1);
        if (error) {
            console.error(`Error checking collision: ${error.message}`);
            // In case of error, assume no collision to allow retry
            return false;
        }
        const exists = Array.isArray(data) && data.length > 0;
        // If ID exists, add to cache to speed up future checks
        if (exists) {
            collisionCache[entityType].add(urlId);
        }
        return exists;
    }
    catch (error) {
        console.error(`Error in collision check: ${error instanceof Error ? error.message : String(error)}`);
        // In case of error, assume no collision to allow retry
        return false;
    }
}
/**
 * Clear the collision cache for a specific entity type or all types
 *
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
function clearCollisionCache(entityType) {
    if (entityType) {
        if (collisionCache[entityType]) {
            collisionCache[entityType].clear();
        }
    }
    else {
        Object.keys(collisionCache).forEach(type => {
            collisionCache[type].clear();
        });
    }
    // Reset counters
    cacheHits = 0;
    cacheMisses = 0;
}
/**
 * Get cache statistics for monitoring
 */
function getCollisionCacheStats() {
    const total = cacheHits + cacheMisses;
    return {
        hits: cacheHits,
        misses: cacheMisses,
        ratio: total > 0 ? cacheHits / total : 0
    };
}
