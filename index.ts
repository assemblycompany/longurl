/**
 * Opaque URLs Package
 * 
 * This package provides tools for generating and managing opaque URLs
 * for entities in the InsiderDrops platform.
 */

// Export types
export * from './types';

// Export core functionality
export * from './src/generator';
export * from './src/resolver';
export * from './src/collision';

// Export utilities
export * from './utils';

/**
 * LongURL Package
 * 
 * Programmable URL shortener for developers - infra-as-code for URLs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  LongURLConfig, 
  EntityConfig, 
  GenerationResult, 
  ResolutionResult, 
  AnalyticsData,
  DEFAULT_CONFIG,
  DEFAULT_DB_CONFIG,
  StorageStrategy
} from './types';
import { generateBase62Id, buildEntityUrl, parseEntityUrl, isValidUrlId } from './utils';
import { checkCollision } from './src/collision';

/**
 * Main LongURL class for URL shortening and management
 */
export class LongURL {
  private config: LongURLConfig;
  private supabase: SupabaseClient;

  constructor(config: LongURLConfig) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      database: {
        ...DEFAULT_DB_CONFIG,
        ...config.database
      }
    };

    // Initialize Supabase client
    this.supabase = createClient(
      this.config.database.connection.url,
      this.config.database.connection.key
    );
  }

  /**
   * Shorten a URL with optional entity context
   */
  async shorten(
    originalUrl: string, 
    options?: {
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<GenerationResult> {
    try {
      // Validate entity type if provided
      if (options?.entityType && !this.config.entities[options.entityType]) {
        return {
          urlId: '',
          shortUrl: '',
          success: false,
          error: `Unknown entity type: ${options.entityType}`
        };
      }

      // Generate URL ID with collision detection
      let urlId = generateBase62Id(this.config.idLength || 6);
      let attempts = 1;
      const MAX_ATTEMPTS = 5;

      while (attempts < MAX_ATTEMPTS) {
        const collisionExists = await checkCollision(
          options?.entityType || 'default',
          urlId,
          this.config.database
        );

        if (!collisionExists) break;

        urlId = generateBase62Id(this.config.idLength || 6);
        attempts++;
      }

      if (attempts >= MAX_ATTEMPTS) {
        return {
          urlId: '',
          shortUrl: '',
          success: false,
          error: `Failed to generate unique ID after ${MAX_ATTEMPTS} attempts`
        };
      }

      // Store the URL
      await this.storeUrl(urlId, originalUrl, options);

      // Build the complete short URL
      const domain = this.config.domain || this.config.baseUrl || 'https://longurl.co';
      const shortUrl = options?.entityType 
        ? buildEntityUrl(options.entityType, urlId, domain)
        : `${domain}/${urlId}`;

      return {
        urlId,
        shortUrl,
        success: true
      };

    } catch (error) {
      return {
        urlId: '',
        shortUrl: '',
        success: false,
        error: `Error shortening URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Resolve a short URL back to its original URL and increment click count
   */
  async resolve(urlId: string): Promise<ResolutionResult> {
    try {
      if (!isValidUrlId(urlId, this.config.idLength)) {
        return {
          success: false,
          error: 'Invalid URL ID format'
        };
      }

      const tableName = this.config.database.lookupTable || 'short_urls';

      // Get the URL record and increment click count
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('url_id', urlId)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'URL not found'
        };
      }

      // Increment click count
      await this.supabase
        .from(tableName)
        .update({ 
          click_count: (data.click_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('url_id', urlId);

      // If entity context exists, fetch the entity
      let entity = undefined;
      if (data.entity_type && data.entity_id && this.config.entities[data.entity_type]) {
        const entityConfig = this.config.entities[data.entity_type];
        const { data: entityData } = await this.supabase
          .from(entityConfig.tableName)
          .select('*')
          .eq(entityConfig.primaryKey, data.entity_id)
          .single();
        
        entity = entityData;
      }

      return {
        originalUrl: data.original_url,
        entity,
        entityId: data.entity_id,
        entityType: data.entity_type,
        clickCount: (data.click_count || 0) + 1,
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Error resolving URL: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get analytics for URLs
   */
  async analytics(entityType?: string): Promise<AnalyticsData> {
    const tableName = this.config.database.lookupTable || 'short_urls';
    
    let query = this.supabase
      .from(tableName)
      .select('url_id, entity_type, click_count, created_at');

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data } = await query;

    if (!data) {
      return {
        totalClicks: 0,
        clicksByEntity: {},
        recentClicks: []
      };
    }

    const totalClicks = data.reduce((sum: number, record: any) => sum + (record.click_count || 0), 0);
    
    const clicksByEntity: Record<string, number> = {};
    data.forEach((record: any) => {
      const type = record.entity_type || 'default';
      clicksByEntity[type] = (clicksByEntity[type] || 0) + (record.click_count || 0);
    });

    const recentClicks = data
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((record: any) => ({
        urlId: record.url_id,
        entityType: record.entity_type,
        clickedAt: record.created_at
      }));

    return {
      totalClicks,
      clicksByEntity,
      recentClicks
    };
  }

  /**
   * Store URL in database
   */
  private async storeUrl(
    urlId: string, 
    originalUrl: string, 
    options?: {
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const tableName = this.config.database.lookupTable || 'short_urls';

    await this.supabase
      .from(tableName)
      .insert({
        url_id: urlId,
        original_url: originalUrl,
        entity_id: options?.entityId,
        entity_type: options?.entityType,
        click_count: 0,
        metadata: options?.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
}

// Export types for users
export * from './types';
export * from './utils'; 