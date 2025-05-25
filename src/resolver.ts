/**
 * Opaque URL Resolver
 * 
 * Resolves opaque URL IDs back to their original entities.
 */

import { createClient } from '@supabase/supabase-js';
import { EntityType, ResolutionResult, DatabaseConfig, StorageStrategy, DEFAULT_DB_CONFIG } from '../types';
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
 * Resolve an opaque URL ID to its corresponding entity
 * 
 * @param entityType Type of entity (insider, company, etc.)
 * @param urlId The URL ID to resolve
 * @param dbConfig Database configuration
 * @returns Resolution result with entity data
 */
export async function resolveUrlId<T = any>(
  entityType: EntityType,
  urlId: string,
  dbConfig: DatabaseConfig = DEFAULT_DB_CONFIG
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
    const cacheKey = `${entityType}:${urlId}`;
    if (resolutionCache[entityType][urlId]) {
      return {
        entity: resolutionCache[entityType][urlId] as T,
        entityId: resolutionCache[entityType][urlId].id || resolutionCache[entityType][urlId].insider_id,
        entityType,
        success: true
      };
    }
    
    // Get Supabase client from environment
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Supabase URL or key not configured'
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Different resolution strategies based on database config
    if (dbConfig.strategy === StorageStrategy.LOOKUP_TABLE) {
      // Using the lookup table strategy
      const lookupTable = dbConfig.lookupTable || 'opaque_urls';
      
      // First, get the entity ID from the lookup table
      const { data: lookupData, error: lookupError } = await supabase
        .from(lookupTable)
        .select('entity_id, entity_type')
        .eq('url_id', urlId)
        .eq('entity_type', entityType)
        .single();
      
      if (lookupError || !lookupData) {
        return {
          success: false,
          error: lookupError ? lookupError.message : 'URL ID not found'
        };
      }
      
      // Now get the actual entity from its table
      const tableName = getTableNameForEntityType(entityType);
      const idColumn = getPrimaryKeyForEntityType(entityType);
      
      const { data: entityData, error: entityError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idColumn, lookupData.entity_id)
        .single();
      
      if (entityError || !entityData) {
        return {
          success: false,
          error: entityError ? entityError.message : 'Entity not found'
        };
      }
      
      // Cache the result
      resolutionCache[entityType][urlId] = entityData;
      
      return {
        entity: entityData as T,
        entityId: lookupData.entity_id,
        entityType,
        success: true
      };
    } else {
      // Using the inline strategy (ID is stored directly in the entity table)
      const tableName = getTableNameForEntityType(entityType);
      const idColumn = dbConfig.urlIdColumn || 'url_id';
      
      const { data, error } = await supabase
        .from(tableName)
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
        entityId: data.id || data.insider_id || data.company_id,
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
 * Get the table name for a given entity type
 */
function getTableNameForEntityType(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.INSIDER:
      return 'insiders';
    case EntityType.COMPANY:
      return 'companies';
    case EntityType.FILING:
      return 'filings';
    case EntityType.USER:
      return 'users';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Get the primary key column for a given entity type
 */
function getPrimaryKeyForEntityType(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.INSIDER:
      return 'insider_id';
    case EntityType.COMPANY:
      return 'company_id';
    case EntityType.FILING:
      return 'id';
    case EntityType.USER:
      return 'id';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Clear the resolution cache for a specific entity type or all types
 * 
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
export function clearResolutionCache(entityType?: EntityType): void {
  if (entityType) {
    resolutionCache[entityType] = {};
  } else {
    // Clear all cache entries
    Object.keys(resolutionCache).forEach(type => {
      resolutionCache[type] = {};
    });
  }
} 