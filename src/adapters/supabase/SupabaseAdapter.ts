/**
 * Supabase Storage Adapter
 * 
 * Production-ready adapter for Supabase/PostgreSQL storage.
 * Includes caching, error handling, and performance optimizations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from '../../core/storage/StorageAdapter.js';
import { EntityData, AnalyticsData } from '../../core/storage/types.js';
import { SupabaseConfig } from './types.js';

export class SupabaseAdapter extends StorageAdapter {
  private client: SupabaseClient<any>;
  private config: SupabaseConfig;
  private cache: Map<string, EntityData> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  private tableName: string = 'short_urls';
  private analyticsTable: string = 'url_analytics';

  constructor(config: SupabaseConfig) {
    super();
    this.config = config;
    this.client = createClient(config.url, config.key);
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const { error } = await this.client.from(this.tableName).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, that's ok for now
        console.warn(`Table ${this.tableName} not found. Please create it or run migrations.`);
      } else if (error) {
        throw new Error(`Failed to connect to Supabase: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SupabaseAdapter initialization failed: ${error instanceof Error ? error.message : String(error)}`);
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
        throw new Error(`Failed to save URL: ${error.message}`);
      }

      // Cache the data
      this.cache.set(urlId, data);
      
      // Set cache expiration
      setTimeout(() => {
        this.cache.delete(urlId);
      }, this.cacheTimeout);

    } catch (error) {
      throw new Error(`SupabaseAdapter save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async resolve(urlId: string): Promise<EntityData | null> {
    try {
      // Check cache first
      if (this.cache.has(urlId)) {
        return this.cache.get(urlId)!;
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('url_id', urlId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to resolve URL: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const entityData: EntityData = {
        urlId: data.url_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        originalUrl: data.original_url,
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Cache the result
      this.cache.set(urlId, entityData);
      setTimeout(() => {
        this.cache.delete(urlId);
      }, this.cacheTimeout);

      return entityData;

    } catch (error) {
      throw new Error(`SupabaseAdapter resolve failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(urlId: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache.has(urlId)) {
        return true;
      }

      const { data, error } = await this.client
        .from(this.tableName)
        .select('url_id')
        .eq('url_id', urlId)
        .single();

      if (error && error.code === 'PGRST116') {
        return false; // Not found
      }

      if (error) {
        throw new Error(`Failed to check existence: ${error.message}`);
      }

      return !!data;

    } catch (error) {
      throw new Error(`SupabaseAdapter exists failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async incrementClicks(urlId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get current click count first
      const { data: currentData, error: selectError } = await this.client
        .from(this.tableName)
        .select('click_count')
        .eq('url_id', urlId)
        .single();

      if (selectError) {
        throw new Error(`Failed to get current click count: ${selectError.message}`);
      }

      const newClickCount = (currentData?.click_count || 0) + 1;

      // Update with incremented count
      const { error: updateError } = await this.client
        .from(this.tableName)
        .update({ 
          click_count: newClickCount,
          updated_at: new Date().toISOString()
        })
        .eq('url_id', urlId);

      if (updateError) {
        throw new Error(`Failed to increment clicks: ${updateError.message}`);
      }

      // Then, record the click event for analytics
      const { error: analyticsError } = await this.client
        .from(this.analyticsTable)
        .insert({
          url_id: urlId,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        });

      // Don't throw on analytics errors, just log them
      if (analyticsError) {
        console.warn(`Failed to record analytics: ${analyticsError.message}`);
      }

      // Invalidate cache
      this.cache.delete(urlId);

    } catch (error) {
      throw new Error(`SupabaseAdapter incrementClicks failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAnalytics(urlId: string): Promise<AnalyticsData | null> {
    try {
      // Get basic data from main table
      const { data: urlData, error: urlError } = await this.client
        .from(this.tableName)
        .select('click_count, created_at, updated_at')
        .eq('url_id', urlId)
        .single();

      if (urlError) {
        if (urlError.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get URL data: ${urlError.message}`);
      }

      // Get click history from analytics table
      const { data: clickData, error: clickError } = await this.client
        .from(this.analyticsTable)
        .select('timestamp, metadata')
        .eq('url_id', urlId)
        .order('timestamp', { ascending: false })
        .limit(100); // Last 100 clicks

      const clickHistory = clickData || [];
      const lastClick = clickHistory.length > 0 ? clickHistory[0] : null;

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
      throw new Error(`SupabaseAdapter getAnalytics failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async close(): Promise<void> {
    // Clear cache
    this.cache.clear();
    
    // Supabase client doesn't need explicit closing
    // but we can clean up any pending operations
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  // Supabase-specific methods

  /**
   * Enable real-time subscriptions for URL changes
   */
  subscribeToChanges(callback: (payload: any) => void) {
    return this.client
      .channel('url-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tableName },
        callback
      )
      .subscribe();
  }

  /**
   * Batch insert for performance
   */
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

      if (error) {
        throw new Error(`Batch insert failed: ${error.message}`);
      }

      // Cache all items
      data.forEach(item => {
        this.cache.set(item.urlId, item);
        setTimeout(() => {
          this.cache.delete(item.urlId);
        }, this.cacheTimeout);
      });

    } catch (error) {
      throw new Error(`SupabaseAdapter saveBatch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 