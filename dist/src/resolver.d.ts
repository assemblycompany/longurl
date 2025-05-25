/**
 * URL Resolver
 *
 * Resolves URL IDs back to their original entities.
 */
import { ResolutionResult, DatabaseConfig } from '../types';
/**
 * Resolve a URL ID to its corresponding entity
 *
 * @param entityType Type of entity (any string)
 * @param urlId The URL ID to resolve
 * @param dbConfig Database configuration
 * @param entityConfig Entity configuration for table mapping
 * @returns Resolution result with entity data
 */
export declare function resolveUrlId<T = any>(entityType: string, urlId: string, dbConfig?: DatabaseConfig, entityConfig?: {
    tableName: string;
    primaryKey: string;
}): Promise<ResolutionResult<T>>;
/**
 * Clear the resolution cache for a specific entity type or all types
 *
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
export declare function clearResolutionCache(entityType?: string): void;
