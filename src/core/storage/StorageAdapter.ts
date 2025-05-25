/**
 * Core Storage Adapter Interface
 * 
 * Defines the contract that all storage adapters must implement.
 * This enables LongURL to work with different storage backends.
 */

import { EntityData, AnalyticsData } from './types.js';

export abstract class StorageAdapter {
  /**
   * Initialize the adapter (connect to database, setup tables, etc.)
   */
  abstract initialize(): Promise<void>;

  /**
   * Save URL data to storage
   */
  abstract save(urlId: string, data: EntityData): Promise<void>;

  /**
   * Resolve a URL ID to its entity data
   */
  abstract resolve(urlId: string): Promise<EntityData | null>;

  /**
   * Check if a URL ID already exists (for collision detection)
   */
  abstract exists(urlId: string): Promise<boolean>;

  /**
   * Increment click count for analytics
   */
  abstract incrementClicks(urlId: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Get analytics data for a URL ID
   */
  abstract getAnalytics(urlId: string): Promise<AnalyticsData | null>;

  /**
   * Close connections and cleanup
   */
  abstract close(): Promise<void>;

  /**
   * Optional: Batch operations for performance
   */
  async saveBatch?(data: EntityData[]): Promise<void> {
    // Default implementation: save one by one
    for (const item of data) {
      await this.save(item.urlId, item);
    }
  }

  /**
   * Optional: Health check
   */
  async healthCheck?(): Promise<boolean> {
    return true;
  }
} 