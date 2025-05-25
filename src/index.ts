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

  constructor(config: LongURLConfig = {}) {
    this.config = config;
    
    // Progressive disclosure: Zero config -> Simple config -> Advanced config
    if (config.adapter) {
      // Level 3: Advanced - Custom adapter injection
      this.adapter = config.adapter;
    } else if (config.supabase || this.hasSupabaseEnvVars()) {
      // Level 1 & 2: Zero config or Simple Supabase config
      const supabaseConfig = this.buildSupabaseConfig(config.supabase);
      this.adapter = new SupabaseAdapter(supabaseConfig);
    } else if (config.database) {
      // Legacy: Backward compatibility
      this.adapter = new SupabaseAdapter({
        url: config.database.connection.url,
        key: config.database.connection.key
      });
    } else {
      throw new Error(
        'LongURL requires configuration. Choose one:\n\n' +
        '1. Environment variables (recommended):\n' +
        '   • Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n' +
        '   • Then: new LongURL()\n\n' +
        '2. Direct configuration:\n' +
        '   • new LongURL({ supabase: { url, key } })\n\n' +
        '3. Custom adapter:\n' +
        '   • new LongURL({ adapter: customAdapter })\n\n' +
        'Environment setup help:\n' +
        '• Node.js: import "dotenv/config" before importing LongURL\n' +
        '• Next.js: Add to .env.local file\n' +
        '• Vercel/Netlify: Set in project settings'
      );
    }
  }

  /**
   * Check if Supabase environment variables are available
   */
  private hasSupabaseEnvVars(): boolean {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  /**
   * Build Supabase configuration with environment variable fallbacks
   */
  private buildSupabaseConfig(userConfig?: LongURLConfig['supabase']) {
    const url = userConfig?.url || process.env.SUPABASE_URL;
    const key = userConfig?.key || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Supabase configuration incomplete. Provide:\n' +
        '• supabase.url and supabase.key in config, OR\n' +
        '• SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables\n\n' +
        'Environment setup examples:\n' +
        '• Node.js: import "dotenv/config" before importing LongURL\n' +
        '• Next.js: Add variables to .env.local\n' +
        '• Vercel: Set in project settings\n' +
        '• Docker: Use -e flags or env_file'
      );
    }

    return {
      url,
      key,
      options: userConfig?.options
    };
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