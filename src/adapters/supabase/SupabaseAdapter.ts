/**
 * Supabase Storage Adapter
 * 
 * Production-ready adapter for Supabase/PostgreSQL storage.
 * Includes retry logic, intelligent caching, and error handling.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from '../../core/storage/StorageAdapter.js';
import { EntityData, AnalyticsData } from '../../core/storage/types.js';
import { SupabaseConfig } from './types.js';
import { parseSupabaseError, logSupabaseError, isRetryableError } from './errors.js';

export class SupabaseAdapter extends StorageAdapter {
  private client: SupabaseClient<any, 'public', any>;
  private config: SupabaseConfig;
  private cache: Map<string, { data: EntityData; expires: number }> = new Map();
  private cacheEnabled: boolean;
  private cacheTimeout: number;
  private maxCacheSize: number;
  private tableName: string = 'short_urls';
  private analyticsTable: string = 'url_analytics';
  
  // Retry configuration
  private maxRetries: number;
  private backoffMs: number;
  private retryableErrors: Set<string>;

  constructor(config: SupabaseConfig) {
    super();
    this.config = config;
    
    // Cache configuration
    this.cacheEnabled = config.options?.cache?.enabled ?? true;
    this.cacheTimeout = config.options?.cache?.ttlMs ?? 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = config.options?.cache?.maxSize ?? 1000;
    
    // Retry configuration
    this.maxRetries = config.options?.retries?.maxAttempts ?? 3;
    this.backoffMs = config.options?.retries?.backoffMs ?? 1000;
    this.retryableErrors = new Set(config.options?.retries?.retryableErrors ?? [
      'PGRST301', // Connection timeout
      'PGRST302', // Connection failed
      '23505',    // Unique violation (for collision detection)
    ]);
    
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
   * Execute operation with retry logic and detailed error handling
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Parse and enhance the error
        const enhancedError = parseSupabaseError(error, operationName, this.tableName);
        
        // Check if error is retryable
        if (!isRetryableError(error) || attempt === this.maxRetries) {
          // Log detailed error information
          logSupabaseError(enhancedError, {
            operation: operationName,
            attempt: attempt + 1,
            tableName: this.tableName
          });
          throw enhancedError;
        }
        
        // Exponential backoff
        const delay = this.backoffMs * Math.pow(2, attempt);
        console.warn(`${operationName} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, enhancedError.code);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This shouldn't be reached, but just in case
    const finalError = parseSupabaseError(lastError, operationName, this.tableName);
    logSupabaseError(finalError);
    throw finalError;
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
    return this.withRetry(async () => {
      const { error } = await this.client.from(this.tableName).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        console.warn(`Table ${this.tableName} not found. Please create it manually.`);
      } else if (error) {
        throw new Error(`Failed to connect to Supabase: ${error.message}`);
      }
    }, 'initialize');
  }

  async save(urlId: string, data: EntityData): Promise<void> {
    return this.withRetry(async () => {
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
        throw new Error(`Failed to save URL: ${error.message}`);
      }

      this.setCache(urlId, data);
    }, 'save');
  }

  async resolve(urlId: string): Promise<EntityData | null> {
    // Check cache first
    const cached = this.getCached(urlId);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('url_id', urlId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to resolve URL: ${error.message}`);
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
    }, 'resolve');
  }

  async exists(urlId: string): Promise<boolean> {
    if (this.getCached(urlId)) return true;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('url_id')
        .eq('url_id', urlId)
        .single();

      if (error?.code === 'PGRST116') return false;
      if (error) throw new Error(`Failed to check existence: ${error.message}`);
      
      return !!data;
    }, 'exists');
  }

  async incrementClicks(urlId: string, metadata?: Record<string, any>): Promise<void> {
    return this.withRetry(async () => {
      // Atomic increment using SQL
      const { error: updateError } = await this.client.rpc('increment_click_count', {
        url_id_param: urlId
      });

      if (updateError) {
        // Fallback to manual increment if RPC doesn't exist
        const { data: currentData, error: selectError } = await this.client
          .from(this.tableName)
          .select('click_count')
          .eq('url_id', urlId)
          .single();

        if (selectError) throw new Error(`Failed to get current click count: ${selectError.message}`);

        const { error: fallbackError } = await this.client
          .from(this.tableName)
          .update({ 
            click_count: (currentData?.click_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('url_id', urlId);

        if (fallbackError) throw new Error(`Failed to increment clicks: ${fallbackError.message}`);
      }

      // Record analytics (non-blocking)
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
    }, 'incrementClicks');
  }

  async getAnalytics(urlId: string): Promise<AnalyticsData | null> {
    return this.withRetry(async () => {
      const { data: urlData, error: urlError } = await this.client
        .from(this.tableName)
        .select('click_count, created_at, updated_at')
        .eq('url_id', urlId)
        .single();

      if (urlError?.code === 'PGRST116') return null;
      if (urlError) throw new Error(`Failed to get URL data: ${urlError.message}`);

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
    }, 'getAnalytics');
  }

  async close(): Promise<void> {
    this.cache.clear();
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.withRetry(async () => {
        const { error } = await this.client
          .from(this.tableName)
          .select('count')
          .limit(1);
        return !error;
      }, 'healthCheck');
    } catch {
      return false;
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
    return this.withRetry(async () => {
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

      if (error) throw new Error(`Batch insert failed: ${error.message}`);

      data.forEach(item => this.setCache(item.urlId, item));
    }, 'saveBatch');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      enabled: this.cacheEnabled
    };
  }
} 