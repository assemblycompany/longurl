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
    LOOKUP_TABLE = "LOOKUP_TABLE",
    /** Store URLs directly in the entity tables */
    INLINE = "INLINE"
}
/**
 * Database configuration for storage and retrieval
 */
export interface DatabaseConfig {
    /** Storage strategy for URLs */
    strategy: StorageStrategy;
    /** Database connection details */
    connection: {
        url: string;
        key: string;
    };
    /** Lookup table name (for LOOKUP_TABLE strategy) */
    lookupTable?: string;
    /** URL ID column name (for INLINE strategy) */
    urlIdColumn?: string;
}
/**
 * Main configuration for LongURL
 */
export interface LongURLConfig {
    /** Custom entity configurations */
    entities?: Record<string, EntityConfig>;
    /** Base domain for shortened URLs */
    baseUrl?: string;
    /**
     * Include entity type in URL path (default: false for shortest URLs)
     *
     * Design Philosophy: URL shorteners should prioritize brevity by default.
     * - false (default): https://yourdomain.co/X7gT5p (shortest)
     * - true (opt-in):   https://yourdomain.co/product/X7gT5p (organized)
     *
     * Use shortest URLs for: social media, SMS, QR codes, character limits
     * Use entity URLs for: SEO, organized link management, branded experiences
     */
    includeEntityInPath?: boolean;
    /**
     * Enable URL shortening with random IDs (default: true)
     *
     * Design Philosophy: Transform from URL shortener to URL management framework.
     * - true (default): Generate short random IDs -> https://yourdomain.co/product/X7gT5p
     * - false (framework mode): Use entity IDs directly -> https://yourdomain.co/product/laptop-123
     *
     * Framework mode benefits:
     * - Readable URLs with entity context
     * - SEO-friendly URL structure
     * - Still gets analytics, collision detection, and entity management
     * - Perfect for content management, e-commerce catalogs, user profiles
     */
    enableShortening?: boolean;
    /** Supabase configuration (default database) */
    supabase?: {
        url?: string;
        key?: string;
        options?: {
            schema?: string;
            headers?: Record<string, string>;
            cache?: {
                enabled?: boolean;
                ttlMs?: number;
                maxSize?: number;
            };
        };
    };
    /** Advanced: Custom adapter injection */
    adapter?: any;
    /** Legacy: Database config (for backward compatibility) */
    database?: DatabaseConfig;
}
/**
 * Result of URL generation
 */
export interface GenerationResult {
    /** Generated URL ID */
    urlId?: string;
    /** Full shortened URL */
    shortUrl?: string;
    /** Original long URL */
    originalUrl?: string;
    /** Entity type */
    entityType?: string;
    /** Original entity ID */
    entityId?: string;
    /** Whether generation was successful */
    success: boolean;
    /** Error message if generation failed */
    error?: string;
}
/**
 * Result of URL resolution
 */
export interface ResolutionResult<T = any> {
    /** Resolved entity data */
    entity?: T;
    /** Original entity ID */
    entityId?: string;
    /** Entity type */
    entityType?: string;
    /** Original long URL */
    originalUrl?: string;
    /** URL ID */
    urlId?: string;
    /** Click count */
    clickCount?: number;
    /** Metadata (optional) */
    metadata?: Record<string, any>;
    /** Whether resolution was successful */
    success: boolean;
    /** Error message if resolution failed */
    error?: string;
}
/**
 * Analytics data structure
 */
export interface AnalyticsData {
    /** URL ID */
    urlId: string;
    /** Total clicks across all URLs */
    totalClicks: number;
    /** When the URL was created */
    createdAt: string;
    /** When the URL was last updated */
    updatedAt: string;
    /** Last click timestamp */
    lastClickAt?: string;
    /** Click history */
    clickHistory?: Array<{
        /** Timestamp of the click */
        timestamp: string;
        /** User agent of the click */
        userAgent?: string;
        /** Referer of the click */
        referer?: string;
        /** IP address of the click */
        ip?: string;
        /** Country of the click */
        country?: string;
    }>;
}
/**
 * Default database configuration
 */
export declare const DEFAULT_DB_CONFIG: DatabaseConfig;
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
 * Structure for parsed entity URLs
 */
export interface ParsedEntityUrl {
    /** The entity type from the URL */
    entityType: string;
    /** The URL ID */
    urlId: string;
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
