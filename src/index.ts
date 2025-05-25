/**
 * LongURL - Programmable URL Shortener
 * 
 * A developer-friendly URL shortener with entity-based organization,
 * collision detection, and analytics tracking.
 */

import { generateUrlId } from './generator';
import { resolveUrlId } from './resolver';
import { StorageAdapter, SupabaseAdapter } from './adapters';
import { 
  LongURLConfig, 
  EntityConfig, 
  GenerationResult, 
  ResolutionResult, 
  AnalyticsData,
  DatabaseConfig,
  StorageStrategy 
} from '../types';

export class LongURL {
  private config: LongURLConfig;
  private adapter: StorageAdapter;

  constructor(config: LongURLConfig) {
    this.config = config;
    
    // Initialize adapter based on config
    if (config.adapter) {
      // New adapter pattern
      this.adapter = config.adapter;
    } else if (config.database) {
      // Legacy database config - create SupabaseAdapter
      this.adapter = new SupabaseAdapter({
        url: config.database.connection.url,
        key: config.database.connection.key
      });
    } else {
      throw new Error('Either adapter or database configuration is required');
    }
  }

  /**
   * Initialize the LongURL instance
   */
  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  /**
   * Shorten a URL for a specific entity
   */
  async shorten(
    entityType: string,
    entityId: string,
    originalUrl: string,
    metadata?: Record<string, any>
  ): Promise<GenerationResult> {
    try {
      // Validate entity type
      if (this.config.entities && !this.config.entities[entityType]) {
        return {
          success: false,
          error: `Unknown entity type: ${entityType}`
        };
      }

      // Generate URL ID with collision detection
      const result = await generateUrlId(
        entityType,
        entityId,
        metadata || {},
        this.getLegacyDbConfig()
      );

      if (!result.success || !result.urlId) {
        return result;
      }

      // Save to storage via adapter
      const entityData = {
        urlId: result.urlId,
        entityType,
        entityId,
        originalUrl,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.adapter.save(result.urlId, entityData);

      // Build short URL
      const baseUrl = this.config.baseUrl || 'https://longurl.co';
      const shortUrl = `${baseUrl}/${result.urlId}`;

      return {
        success: true,
        urlId: result.urlId,
        shortUrl,
        originalUrl,
        entityType,
        entityId
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to shorten URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Resolve a short URL back to its original URL and entity
   */
  async resolve(urlId: string): Promise<ResolutionResult> {
    try {
      const entityData = await this.adapter.resolve(urlId);
      
      if (!entityData) {
        return {
          success: false,
          error: 'URL not found'
        };
      }

      // Increment click count
      await this.adapter.incrementClicks(urlId);

      return {
        success: true,
        urlId,
        originalUrl: entityData.originalUrl,
        entityType: entityData.entityType,
        entityId: entityData.entityId,
        metadata: entityData.metadata,
        clickCount: 1 // Will be updated by analytics
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get analytics data for a URL
   */
  async analytics(urlId: string): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
    try {
      const data = await this.adapter.getAnalytics(urlId);
      
      if (!data) {
        return {
          success: false,
          error: 'URL not found'
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get analytics: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Close the adapter connection
   */
  async close(): Promise<void> {
    await this.adapter.close();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.adapter.healthCheck ? await this.adapter.healthCheck() : true;
  }

  /**
   * Get legacy database config for backward compatibility
   */
  private getLegacyDbConfig(): DatabaseConfig {
    if (this.config.database) {
      return this.config.database;
    }
    
    // Default config for adapter-based setup
    return {
      strategy: StorageStrategy.LOOKUP_TABLE,
      connection: {
        url: 'adapter-managed',
        key: 'adapter-managed'
      },
      lookupTable: 'short_urls'
    };
  }
}

// Export everything
export { StorageAdapter, SupabaseAdapter } from './adapters';
export type { 
  LongURLConfig, 
  EntityConfig, 
  GenerationResult, 
  ResolutionResult, 
  AnalyticsData 
} from '../types'; 