/**
 * Type definitions for the longurl package
 */

/**
 * Legacy entity types enum for backward compatibility
 */
export enum EntityType {
  INSIDER = 'insider',
  COMPANY = 'company', 
  FILING = 'filing',
  USER = 'user'
}

/**
 * Legacy config interface for backward compatibility
 */
export interface OpaqueUrlConfig {
  idLength?: number;
  domain?: string;
}

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
export enum StorageStrategy {
  /** Store URLs in a separate lookup table */
  LOOKUP_TABLE = 'lookup_table',
  
  /** Store URLs directly in the entity tables */
  INLINE = 'inline'
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
  entities: Record<string, EntityConfig>;
  
  /** Database configuration */
  database: DatabaseConfig;
  
  /** Base domain for shortened URLs */
  domain: string;
  
  /** Default URL ID length */
  idLength?: number;
  
  /** Enable analytics tracking */
  analytics?: boolean;
}

/**
 * Result of URL generation
 */
export interface GenerationResult {
  /** Generated URL ID */
  urlId: string;
  
  /** Full shortened URL */
  shortUrl: string;
  
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
  
  /** Whether resolution was successful */
  success: boolean;
  
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  /** Total clicks across all URLs */
  totalClicks: number;
  
  /** Clicks broken down by entity type */
  clicksByEntity: Record<string, number>;
  
  /** Recent click events */
  recentClicks: Array<{
    urlId: string;
    entityType: string;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
  }>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<LongURLConfig> = {
  idLength: 6,
  analytics: true
};

/**
 * Legacy default config for backward compatibility
 */
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  strategy: StorageStrategy.LOOKUP_TABLE,
  connection: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  lookupTable: 'short_urls',
  urlIdColumn: 'url_id'
};

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