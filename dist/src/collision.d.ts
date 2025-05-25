/**
 * Collision detection for URL IDs
 *
 * Handles checking if a generated ID already exists in the database.
 */
import { DatabaseConfig } from '../types';
/**
 * Check if a URL ID already exists for the given entity type
 *
 * @param entityType Type of entity (or 'default' for non-entity URLs)
 * @param urlId The URL ID to check
 * @param dbConfig Database configuration
 * @returns True if collision exists, false otherwise
 */
export declare function checkCollision(entityType: string, urlId: string, dbConfig: DatabaseConfig): Promise<boolean>;
/**
 * Clear the collision cache for a specific entity type or all types
 *
 * @param entityType Optional entity type to clear (if omitted, clear all)
 */
export declare function clearCollisionCache(entityType?: string): void;
/**
 * Get cache statistics for monitoring
 */
export declare function getCollisionCacheStats(): {
    hits: number;
    misses: number;
    ratio: number;
};
