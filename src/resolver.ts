/**
 * URL Resolver
 * 
 * Resolves URL IDs back to their original entities.
 */

import { createClient } from '@supabase/supabase-js';
import { ResolutionResult, DatabaseConfig, StorageStrategy, DEFAULT_DB_CONFIG } from '../types';
import { isValidUrlId } from '../utils';

// Cache for resolution results to improve performance
const resolutionCache: Record<string, Record<string, any>> = {};

/**
 * Initialize cache for entity type if it doesn't exist
 */
function initCacheForType(entityType: string): void {
  if (!resolutionCache[entityType]) {
    resolutionCache[entityType] = {};
  }
}

/**
 * Resolve a URL ID to its corresponding entity
 * 
 * @param entityType Type of entity (any string)
 * @param urlId The URL ID to resolve
 * @param dbConfig Database configuration
 * @param entityConfig Entity configuration for table mapping
 * @returns Resolution result with entity data
 */
export async function resolveUrlId<T = any>(
  entityType: string,
  urlId: string,
  dbConfig: DatabaseConfig = DEFAULT_DB_CONFIG,
  entityConfig?: { tableName: string; primaryKey: string }
): Promise<ResolutionResult<T>> {
  try {
    // Input validation
    if (!urlId || !isValidUrlId(urlId)) {
      return {
        success: false,
        error: 'Invalid URL ID format'
      };
    }
    
    // Initialize cache for this entity type
    initCacheForType(entityType);
    
    // Check cache first
    if (resolutionCache[entityType][urlId]) {
      return {
        entity: resolutionCache[entityType][urlId] as T,
        entityId: resolutionCache[entityType][urlId][entityConfig?.primaryKey || 'id'],
        entityType,
        success: true
      };
    }
    
    // Get Supabase client from database config
    const supabase = createClient(
      dbConfig.connection.url,
      dbConfig.connection.key
    );
    
    // Different resolution strategies based on database config
    if (dbConfig.strategy === StorageStrategy.LOOKUP_TABLE) {
      // Using the lookup table strategy
      const lookupTable = dbConfig.lookupTable || 'short_urls';
      
      // First, get the entity ID from the lookup table
      const { data: lookupData, error: lookupError } = await supabase
        .from(lookupTable)
        .select('entity_id, entity_type, original_url')
        .eq('url_id', urlId)
        .eq('entity_type', entityType)
        .single();
      
      if (lookupError || !lookupData) {
        return {
          success: false,
          error: lookupError ? lookupError.message : 'URL ID not found'
        };
      }
      
      // If entity config is provided, fetch the actual entity
      let entity = undefined;
      if (entityConfig && lookupData.entity_id) {
        const { data: entityData, error: entityError } = await supabase
          .from(entityConfig.tableName)
          .select('*')
          .eq(entityConfig.primaryKey, lookupData.entity_id)
          .single();
        
        if (!entityError && entityData) {
          entity = entityData;
          // Cache the result
          resolutionCache[entityType][urlId] = entityData;
        }
      }
      
      return {
        entity: entity as T,
        entityId: lookupData.entity_id,
        entityType,
        success: true
      };
    } else {
      // Using the inline strategy (ID is stored directly in the entity table)
      if (!entityConfig) {
        return {
          success: false,
          error: 'Entity configuration required for inline strategy'
        };
      }
      
      const idColumn = dbConfig.urlIdColumn || 'url_id';
      
      const { data, error } = await supabase
        .from(entityConfig.tableName)
        .select('*')
        .eq(idColumn, urlId)
        .single();
      
      if (error || !data) {
        return {
          success: false,
          error: error ? error.message : 'URL ID not found'
        };
      }
      
      // Cache the result
      resolutionCache[entityType][urlId] = data;
      
      return {
        entity: data as T,
        entityId: data[entityConfig.primaryKey],
        entityType,
        success: true
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error resolving URL ID: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Clear the resolution cache for a specific entity type or all types
 * 
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
export function clearResolutionCache(entityType?: string): void {
  if (entityType) {
    resolutionCache[entityType] = {};
  } else {
    // Clear all cache entries
    Object.keys(resolutionCache).forEach(type => {
      resolutionCache[type] = {};
    });
  }
} 