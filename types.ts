/**
 * Type definitions for the longurl package
 */

/**
 * Core Types for LongURL
 */

import { StorageAdapter } from './src/core/storage/StorageAdapter';

/**
 * Options for URL generation with backward compatibility
 */
export interface UrlGenerationOptions {
  /** Length of generated ID (default: 6) */
  idLength?: number;
  
  /** Domain for generated URLs */
  domain?: string;
  
  /** Enable URL shortening with random IDs (default: true) */
  enableShortening?: boolean;
  
  /** Include entity type in URL path (default: false) */
  includeEntityInPath?: boolean;
  
  /** URL pattern with placeholders (e.g., 'furniture-vintage-table-lamp-{publicId}') */
  urlPattern?: string;
  
  /** NEW: Clear naming for public-facing identifier */
  publicId?: string;
  
  /** DEPRECATED: Use publicId instead for clarity */
  endpointId?: string;
  
  /** Whether to include publicId in the URL slug (default: true) */
  includeInSlug?: boolean;
  
  /** Whether to generate QR code for the URL (default: true) */
  generate_qr_code?: boolean;
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
  LOOKUP_TABLE = 'LOOKUP_TABLE',
  
  /** Store URLs directly in the entity tables */
  INLINE = 'INLINE'
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
    url?: string;  // defaults to SUPABASE_URL env var
    key?: string;  // defaults to SUPABASE_SERVICE_ROLE_KEY env var
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
  adapter?: any; // Will be properly typed when adapters are imported
  
  /** Legacy: Database config (for backward compatibility) */
  database?: DatabaseConfig;
}

/**
 * Result of URL generation
 */
export interface GenerationResult {
  /** The public path segment (readable slug or short ID) */
  urlSlug?: string;
  
  /** The destination URL or internal route */
  urlBase?: string;
  
  /** The complete generated URL */
  urlOutput?: string;
  
  /** @deprecated Use urlSlug instead. The public path segment */
  urlId?: string;
  
  /** @deprecated Use urlOutput instead. Full shortened URL */
  shortUrl?: string;
  
  /** @deprecated Use urlBase instead. Original long URL or internal route */
  originalUrl?: string;
  
  /** Entity type */
  entityType?: string;
  
  /** Original entity ID */
  entityId?: string;
  
  /** The generated or provided public ID */
  publicId?: string;
  
  /** QR code as base64 data URL (if generated and storeQRInTable: true) */
  qrCode?: string;
  
  /** QR code URL from storage bucket (default storage method) */
  qrCodeUrl?: string;
  
  /** Short URL slug for sharing (always generated, even in Framework Mode) */
  url_slug_short?: string;
  
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
  
  /** The destination URL or internal route */
  urlBase?: string;
  
  /** The public path segment */
  urlSlug?: string;
  
  /** @deprecated Use urlBase instead. Original long URL or internal route */
  originalUrl?: string;
  
  /** @deprecated Use urlSlug instead. URL ID */
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
  /** The public path segment */
  urlSlug: string;
  
  /** @deprecated Use urlSlug instead. URL ID */
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
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  strategy: StorageStrategy.LOOKUP_TABLE,
  connection: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  lookupTable: process.env.LONGURL_TABLE_NAME || 'endpoints',
  urlIdColumn: 'url_slug'
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
 * Database record structure for URL endpoints
 */
export interface EndpointRecord {
  /** Primary key */
  id: string;
  
  /** URL slug/path segment */
  url_slug: string;
  
  /** Base URL/route target */
  url_base: string;
  
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
 * @deprecated Use EndpointRecord instead. Legacy database record structure for backwards compatibility
 */
export interface ShortUrlRecord {
  /** Primary key */
  id: string;
  
  /** @deprecated Use url_slug instead. Short URL ID */
  url_id: string;
  
  /** @deprecated Use url_base instead. Original long URL */
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