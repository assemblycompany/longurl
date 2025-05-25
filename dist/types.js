"use strict";
/**
 * Type definitions for the longurl package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.DEFAULT_DB_CONFIG = exports.StorageStrategy = void 0;
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
 * Default database configuration
 */
exports.DEFAULT_DB_CONFIG = {
    strategy: StorageStrategy.LOOKUP_TABLE,
    lookupTable: 'short_urls',
    urlIdColumn: 'url_id'
};
/**
 * Default configuration for LongURL
 */
exports.DEFAULT_CONFIG = {
    idLength: 6,
    useCache: true,
    baseUrl: 'https://longurl.co'
};
