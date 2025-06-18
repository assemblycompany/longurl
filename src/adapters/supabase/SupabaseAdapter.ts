/**
 * Supabase Storage Adapter
 * 
 * Production-ready adapter for Supabase/PostgreSQL storage.
 * Includes intelligent caching and detailed error handling.
 * Retry logic is handled by the user's application layer.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from '../../core/storage/StorageAdapter.js';
import { EntityData, AnalyticsData } from '../../core/storage/types.js';
import { SupabaseConfig } from './types.js';
import { parseSupabaseError, logSupabaseError } from './errors.js';

export class SupabaseAdapter extends StorageAdapter {
  private client: SupabaseClient<any, 'public', any>;
  private config: SupabaseConfig;
  private cache: Map<string, { data: EntityData; expires: number }> = new Map();
  private cacheEnabled: boolean;
  private cacheTimeout: number;
  private maxCacheSize: number;
  private tableName: string;
  private analyticsTable: string;

  constructor(config: SupabaseConfig) {
    super();
    this.config = config;
    
    // Allow environment variable override for table names
    this.tableName = process.env.LONGURL_TABLE_NAME || 'short_urls';
    this.analyticsTable = process.env.LONGURL_ANALYTICS_TABLE_NAME || 'url_analytics';
    
    // Cache configuration
    this.cacheEnabled = config.options?.cache?.enabled ?? true;
    this.cacheTimeout = config.options?.cache?.ttlMs ?? 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = config.options?.cache?.maxSize ?? 1000;
    
    // Create Supabase client (connection pooling handled internally)
    this.client = createClient(config.url, config.key, {
      db: {
        schema: config.options?.schema ?? 'public',
      },
      global: {
        headers: config.options?.headers ?? {},
      },
    }) as SupabaseClient<any, 'public', any>;
  }

  /**
   * Handle errors with detailed context - no retry logic
   */
  private handleError(error: any, operation: string): never {
    const enhancedError = parseSupabaseError(error, operation, this.tableName);
    logSupabaseError(enhancedError, {
      operation,
      tableName: this.tableName
    });
    throw enhancedError;
  }

  /**
   * Intelligent cache management with size limits and expiration
   */
  private cleanupCache(): void {
    if (!this.cacheEnabled) return;
    
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
    
    // If still over limit, remove oldest entries (LRU-style)
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      const toRemove = entries
        .sort((a, b) => a[1].expires - b[1].expires)
        .slice(0, this.cache.size - this.maxCacheSize);
      
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getCached(urlId: string): EntityData | null {
    if (!this.cacheEnabled) return null;
    
    const entry = this.cache.get(urlId);
    if (!entry || entry.expires < Date.now()) {
      this.cache.delete(urlId);
      return null;
    }
    
    return entry.data;
  }

  private setCache(urlId: string, data: EntityData): void {
    if (!this.cacheEnabled) return;
    
    this.cache.set(urlId, {
      data,
      expires: Date.now() + this.cacheTimeout
    });
    
    // Cleanup if needed
    if (this.cache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
  }

  async initialize(): Promise<void> {
    try {
      const { error } = await this.client.from(this.tableName).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        console.warn(`Table ${this.tableName} not found. Please create it manually.`);
      } else if (error) {
        this.handleError(error, 'initialize');
      }
    } catch (error) {
      this.handleError(error, 'initialize');
    }
  }

  async save(urlId: string, data: EntityData): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .insert({
          url_id: urlId,
          entity_type: data.entityType,
          entity_id: data.entityId,
          original_url: data.originalUrl,
          metadata: data.metadata || {},
          created_at: data.createdAt,
          updated_at: data.updatedAt
        });

      if (error) {
        this.handleError(error, 'save');
      }

      this.setCache(urlId, data);
    } catch (error) {
      this.handleError(error, 'save');
    }
  }

  async resolve(urlId: string): Promise<EntityData | null> {
    // Check cache first
    const cached = this.getCached(urlId);
    if (cached) return cached;

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('url_id', urlId)
        .single();

      if (error?.code === 'PGRST116') return null; // Not found - expected
      if (error) this.handleError(error, 'resolve');
      if (!data) return null;

      const entityData: EntityData = {
        urlId: data.url_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        originalUrl: data.original_url,
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      this.setCache(urlId, entityData);
      return entityData;
    } catch (error) {
      this.handleError(error, 'resolve');
    }
  }

  async exists(urlId: string): Promise<boolean> {
    if (this.getCached(urlId)) return true;

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('url_id')
        .eq('url_id', urlId)
        .single();

      if (error?.code === 'PGRST116') return false; // Not found - expected
      if (error) this.handleError(error, 'exists');
      
      return !!data;
    } catch (error) {
      this.handleError(error, 'exists');
    }
  }

  async incrementClicks(urlId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Try atomic increment first (if RPC exists)
      const { error: rpcError } = await this.client.rpc('increment_click_count', {
        url_id_param: urlId
      });

      if (rpcError && rpcError.code !== '42883') { // 42883 = function doesn't exist
        this.handleError(rpcError, 'incrementClicks');
      }

      // Fallback to manual increment if RPC doesn't exist
      if (rpcError?.code === '42883') {
        const { data: currentData, error: selectError } = await this.client
          .from(this.tableName)
          .select('click_count')
          .eq('url_id', urlId)
          .single();

        if (selectError) this.handleError(selectError, 'incrementClicks');

        const { error: updateError } = await this.client
          .from(this.tableName)
          .update({ 
            click_count: (currentData?.click_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('url_id', urlId);

        if (updateError) this.handleError(updateError, 'incrementClicks');
      }

      // Record analytics (non-blocking - don't throw on analytics errors)
      this.client
        .from(this.analyticsTable)
        .insert({
          url_id: urlId,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        })
        .then(({ error }) => {
          if (error) console.warn(`Analytics recording failed: ${error.message}`);
        });

      // Invalidate cache
      this.cache.delete(urlId);
    } catch (error) {
      this.handleError(error, 'incrementClicks');
    }
  }

  async getAnalytics(urlId: string): Promise<AnalyticsData | null> {
    try {
      const { data: urlData, error: urlError } = await this.client
        .from(this.tableName)
        .select('click_count, created_at, updated_at')
        .eq('url_id', urlId)
        .single();

      if (urlError?.code === 'PGRST116') return null; // Not found - expected
      if (urlError) this.handleError(urlError, 'getAnalytics');

      const { data: clickData } = await this.client
        .from(this.analyticsTable)
        .select('timestamp, metadata')
        .eq('url_id', urlId)
        .order('timestamp', { ascending: false })
        .limit(100);

      const clickHistory = clickData || [];
      const lastClick = clickHistory[0];

      return {
        urlId,
        totalClicks: urlData.click_count || 0,
        createdAt: urlData.created_at,
        updatedAt: urlData.updated_at,
        lastClickAt: lastClick?.timestamp,
        clickHistory: clickHistory.map(click => ({
          timestamp: click.timestamp,
          userAgent: click.metadata?.userAgent,
          referer: click.metadata?.referer,
          ip: click.metadata?.ip,
          country: click.metadata?.country
        }))
      };
    } catch (error) {
      this.handleError(error, 'getAnalytics');
    }
  }

  async close(): Promise<void> {
    this.cache.clear();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .select('count')
        .limit(1);
      return !error;
    } catch {
      return false; // Don't throw on health check - just return false
    }
  }

  // Supabase-specific methods

  subscribeToChanges(callback: (payload: any) => void) {
    return this.client
      .channel('url-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tableName },
        callback
      )
      .subscribe();
  }

  async saveBatch(data: EntityData[]): Promise<void> {
    try {
      const insertData = data.map(item => ({
        url_id: item.urlId,
        entity_type: item.entityType,
        entity_id: item.entityId,
        original_url: item.originalUrl,
        metadata: item.metadata || {},
        created_at: item.createdAt,
        updated_at: item.updatedAt
      }));

      const { error } = await this.client
        .from(this.tableName)
        .insert(insertData);

      if (error) this.handleError(error, 'saveBatch');

      data.forEach(item => this.setCache(item.urlId, item));
    } catch (error) {
      this.handleError(error, 'saveBatch');
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      enabled: this.cacheEnabled
    };
  }
} 