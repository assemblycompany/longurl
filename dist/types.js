"use strict";
/**
 * Type definitions for the longurl package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DB_CONFIG = exports.DEFAULT_CONFIG = exports.StorageStrategy = exports.EntityType = void 0;
/**
 * Legacy entity types enum for backward compatibility
 */
var EntityType;
(function (EntityType) {
    EntityType["INSIDER"] = "insider";
    EntityType["COMPANY"] = "company";
    EntityType["FILING"] = "filing";
    EntityType["USER"] = "user";
})(EntityType || (exports.EntityType = EntityType = {}));
/**
 * Storage strategy for URLs
 */
var StorageStrategy;
(function (StorageStrategy) {
    /** Store URLs in a separate lookup table */
    StorageStrategy["LOOKUP_TABLE"] = "lookup_table";
    /** Store URLs directly in the entity tables */
    StorageStrategy["INLINE"] = "inline";
})(StorageStrategy || (exports.StorageStrategy = StorageStrategy = {}));
/**
 * Default configuration values
 */
exports.DEFAULT_CONFIG = {
    idLength: 6,
    analytics: true
};
/**
 * Legacy default config for backward compatibility
 */
exports.DEFAULT_DB_CONFIG = {
    strategy: StorageStrategy.LOOKUP_TABLE,
    connection: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    lookupTable: 'short_urls',
    urlIdColumn: 'url_id'
};
