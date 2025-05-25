/**
 * Type definitions for the longurl package
 */
/**
 * Entity configuration for custom entity types
 */
export interface EntityConfig {
    /** Database table name for this entity */
    tableName: string;
    /** Primary key column name */
    primaryKey: string;
    /** Optional URL path prefix (defaults to entity name) */
    urlPrefix?: string;
}
/**
 * Storage strategy for URLs
 */
export declare enum StorageStrategy {
    /** Store URLs in a separate lookup table */
    LOOKUP_TABLE = "lookup_table",
    /** Store URLs directly in the entity tables */
    INLINE = "inline"
}
/**
 * Database configuration for storage and retrieval
 */
export interface DatabaseConfig {
    /** Storage strategy for URLs */
    strategy: StorageStrategy;
    /** Lookup table name (used with LOOKUP_TABLE strategy) */
    lookupTable?: string;
    /** Column name for URL IDs (used with INLINE strategy) */
    urlIdColumn?: string;
    /** Database connection config */
    connection: {
        url: string;
        key: string;
    };
}
/**
 * Configuration for the LongURL system
 */
export interface LongURLConfig {
    /** Entity configurations */
    entities: Record<string, EntityConfig>;
    /** Database configuration */
    database: DatabaseConfig;
    /** Length of the generated ID (default: 6) */
    idLength?: number;
    /** Whether to use cache for faster lookups */
    useCache?: boolean;
    /** Base URL for constructing full URLs */
    baseUrl?: string;
    /** Custom domain for short URLs */
    domain?: string;
}
/**
 * Default database configuration
 */
export declare const DEFAULT_DB_CONFIG: Partial<DatabaseConfig>;
/**
 * Default configuration for LongURL
 */
export declare const DEFAULT_CONFIG: Partial<LongURLConfig>;
/**
 * Generation result
 */
export interface GenerationResult {
    /** The generated URL ID */
    urlId: string;
    /** The complete short URL */
    shortUrl: string;
    /** Whether the operation was successful */
    success: boolean;
    /** Error message if the operation failed */
    error?: string;
}
/**
 * Resolution result from lookups
 */
export interface ResolutionResult<T = any> {
    /** The original URL */
    originalUrl?: string;
    /** The entity that was resolved */
    entity?: T;
    /** The entity ID */
    entityId?: string;
    /** The entity type */
    entityType?: string;
    /** Click count */
    clickCount?: number;
    /** Whether the resolution was successful */
    success: boolean;
    /** Error message if the resolution failed */
    error?: string;
}
/**
 * Structure for parsed entity URLs
 */
export interface ParsedEntityUrl {
    /** The entity type from the URL */
    entityType: string;
    /** The URL ID */
    urlId: string;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    /** Number of cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Hit ratio (hits / total) */
    ratio: number;
    /** Total lookups */
    total: number;
}
/**
 * Database record structure for short URLs
 */
export interface ShortUrlRecord {
    /** Primary key */
    id: string;
    /** Short URL ID */
    url_id: string;
    /** Original long URL */
    original_url: string;
    /** ID of the entity this URL points to (optional) */
    entity_id?: string;
    /** Type of entity (optional) */
    entity_type?: string;
    /** Click count */
    click_count: number;
    /** Metadata (optional) */
    metadata?: Record<string, any>;
    /** When the URL was created */
    created_at: string;
    /** When the URL was last updated */
    updated_at: string;
}
/**
 * Analytics data structure
 */
export interface AnalyticsData {
    /** Total clicks */
    totalClicks: number;
    /** Clicks by entity type */
    clicksByEntity: Record<string, number>;
    /** Recent activity */
    recentClicks: Array<{
        urlId: string;
        entityType?: string;
        clickedAt: string;
    }>;
}
