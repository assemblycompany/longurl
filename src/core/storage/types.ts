/**
 * Core Storage Types
 * 
 * Shared types used by all storage adapters.
 */

/**
 * Core storage interface for entity data
 */
export interface EntityData {
  /** The public path segment (readable slug or short ID) */
  urlSlug: string;
  
  /** The destination URL or internal route */
  urlBase: string;
  
  /** @deprecated Use urlSlug instead. Public path segment */
  urlId: string;
  
  /** @deprecated Use urlBase instead. Destination URL or internal route */
  originalUrl: string;
  
  /** Entity type for organization */
  entityType: string;
  
  /** Original entity identifier */
  entityId: string;
  
  /** Additional metadata */
  metadata: Record<string, any>;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** QR code as base64 data URL (optional) */
  qrCode?: string;
}

/**
 * Analytics data for storage adapters
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
 * Base adapter configuration
 */
export interface AdapterConfig {
  [key: string]: any;
} 