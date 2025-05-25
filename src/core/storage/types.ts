/**
 * Core Storage Types
 * 
 * Shared types used by all storage adapters.
 */

/**
 * Entity data structure stored by adapters
 */
export interface EntityData {
  urlId: string;
  entityType: string;
  entityId: string;
  originalUrl: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  urlId: string;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
  lastClickAt?: string;
  clickHistory?: Array<{
    timestamp: string;
    userAgent?: string;
    referer?: string;
    ip?: string;
    country?: string;
  }>;
}

/**
 * Base adapter configuration
 */
export interface AdapterConfig {
  [key: string]: any;
} 