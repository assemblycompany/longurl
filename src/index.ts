/**
 * LongURL - Programmable URL Shortener
 * 
 * Infrastructure-as-code for URLs. Built for developers who need control.
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
import { buildEntityUrl } from '../utils';

export class LongURL {
  private config: LongURLConfig;
  private adapter: StorageAdapter;

  constructor(config: LongURLConfig = {}) {
    // Handle includeEntityInPath with environment variable fallback
    const includeEntityInPath = config.includeEntityInPath ?? 
      (process.env.LONGURL_INCLUDE_ENTITY_IN_PATH === 'true');
    
    // Handle enableShortening with environment variable fallback
    const enableShortening = config.enableShortening ?? 
      (process.env.LONGURL_SHORTEN !== 'false'); // Default to true unless explicitly set to 'false'
    
    this.config = {
      ...config,
      includeEntityInPath,
      enableShortening
    };
    
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
   * Transform result to include both new and legacy field names for backward compatibility
   */
  private enhanceGenerationResult(result: GenerationResult): GenerationResult {
    if (result.success && result.urlId && result.shortUrl && result.originalUrl) {
      return {
        ...result,
        // NEW: Clear naming
        urlSlug: result.urlSlug || result.urlId,
        urlBase: result.urlBase || result.originalUrl,
        urlOutput: result.urlOutput || result.shortUrl,
        // LEGACY: Keep existing fields for backward compatibility
        urlId: result.urlSlug || result.urlId,
        shortUrl: result.urlOutput || result.shortUrl,
        originalUrl: result.urlBase || result.originalUrl
      };
    }
    return result;
  }

  /**
   * Transform resolution result to include both new and legacy field names
   */
  private enhanceResolutionResult<T>(result: ResolutionResult<T>): ResolutionResult<T> {
    if (result.success && result.urlId && result.originalUrl) {
      return {
        ...result,
        // NEW: Clear naming
        urlSlug: result.urlId,
        urlBase: result.originalUrl,
        // LEGACY: Keep existing fields for backward compatibility
        urlId: result.urlId,
        originalUrl: result.originalUrl
      };
    }
    return result;
  }

  /**
   * Manage a URL for a specific entity
   * 
   * Primary method for the LongURL framework. Handles both shortening mode
   * and framework mode with readable URLs.
   */
  async manageUrl(
    entityType: string,
    entityId: string,
    originalUrl: string,
    metadata?: Record<string, any>,
    options?: {
      urlPattern?: string;
      publicId?: string;  // NEW: Clear naming for public-facing identifier
      endpointId?: string; // DEPRECATED: Use publicId instead for clarity
    }
  ): Promise<GenerationResult> {
    try {
      // Validate entity type
      if (this.config.entities && !this.config.entities[entityType]) {
        return {
          success: false,
          error: `Unknown entity type: ${entityType}`
        };
      }

      // Support both publicId (new) and endpointId (deprecated)
      const publicId = options?.publicId || options?.endpointId;

      // Generate URL ID with collision detection
      const result = await generateUrlId(
        entityType,
        entityId,
        { 
          enableShortening: this.config.enableShortening,
          includeEntityInPath: this.config.includeEntityInPath,
          domain: this.config.baseUrl || 'https://longurl.co',
          urlPattern: options?.urlPattern,
          publicId: publicId  // NEW: Use publicId parameter
        },
        this.getLegacyDbConfig()
      );

      if (!result.success || !result.urlId) {
        return result;
      }

      // Save to storage via adapter
      const entityData = {
        urlId: result.urlId,
        urlSlug: result.urlId,  // NEW: Clear naming
        entityType,
        entityId,
        originalUrl,
        urlBase: originalUrl,   // NEW: Clear naming
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.adapter.save(result.urlId, entityData);

      // Build short URL
      const baseUrl = this.config.baseUrl || 'https://longurl.co';
      const shortUrl = this.config.includeEntityInPath 
        ? buildEntityUrl(baseUrl, entityType, result.urlId)
        : `${baseUrl}/${result.urlId}`;

      const generationResult = {
        success: true,
        urlId: result.urlId,
        shortUrl,
        originalUrl,
        entityType,
        entityId,
        // NEW: Clear naming
        urlSlug: result.urlId,
        urlBase: originalUrl,
        urlOutput: shortUrl
      };

      return this.enhanceGenerationResult(generationResult);

    } catch (error) {
      return {
        success: false,
        error: `Failed to manage URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Shorten a URL for a specific entity (legacy alias)
   * 
   * @deprecated Use manageUrl() instead for clearer semantics.
   * This method is maintained for backward compatibility.
   */
  async shorten(
    entityType: string,
    entityId: string,
    originalUrl: string,
    metadata?: Record<string, any>,
    options?: {
      urlPattern?: string;
      publicId?: string;  // NEW: Clear naming for public-facing identifier
      endpointId?: string; // DEPRECATED: Use publicId instead for clarity
    }
  ): Promise<GenerationResult> {
    return this.manageUrl(entityType, entityId, originalUrl, metadata, options);
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
      lookupTable: process.env.LONGURL_TABLE_NAME || 'short_urls'
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