/**
 * Opaque URL Resolver
 *
 * Resolves opaque URL IDs back to their original entities.
 */
import { EntityType, ResolutionResult, DatabaseConfig } from '../types';
/**
 * Resolve an opaque URL ID to its corresponding entity
 *
 * @param entityType Type of entity (insider, company, etc.)
 * @param urlId The URL ID to resolve
 * @param dbConfig Database configuration
 * @returns Resolution result with entity data
 */
export declare function resolveUrlId<T = any>(entityType: EntityType, urlId: string, dbConfig?: DatabaseConfig): Promise<ResolutionResult<T>>;
/**
 * Clear the resolution cache for a specific entity type or all types
 *
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
export declare function clearResolutionCache(entityType?: EntityType): void;
