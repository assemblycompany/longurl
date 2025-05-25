/**
 * Opaque URL Generator
 *
 * Generates unique, opaque URL IDs for various entity types.
 */
import { EntityType, OpaqueUrlConfig, GenerationResult, DatabaseConfig } from '../types';
/**
 * Generate an opaque URL ID for an entity
 *
 * @param entityType Type of entity (insider, company, etc.)
 * @param entityId Original entity ID
 * @param config Configuration options
 * @returns Generated URL and result info
 */
export declare function generateUrlId(entityType: EntityType, entityId: string, config?: OpaqueUrlConfig, dbConfig?: DatabaseConfig): Promise<GenerationResult>;
/**
 * Validate whether a string is a valid opaque URL ID
 *
 * @param urlId The URL ID to validate
 * @param idLength Expected length (default: 6)
 * @returns True if valid, false otherwise
 */
export declare function validateUrlId(urlId: string, idLength?: number): boolean;
