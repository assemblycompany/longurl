/**
 * URL Generator
 *
 * Generates unique URL IDs for any entity types.
 */
import { GenerationResult, DatabaseConfig } from '../types';
/**
 * Generate a URL ID for an entity
 *
 * @param entityType Type of entity (any string)
 * @param entityId Original entity ID
 * @param options Configuration options
 * @returns Generated URL and result info
 */
export declare function generateUrlId(entityType: string, entityId: string, options?: {
    idLength?: number;
    domain?: string;
    enableShortening?: boolean;
}, dbConfig?: DatabaseConfig): Promise<GenerationResult>;
/**
 * Validate whether a string is a valid URL ID
 *
 * @param urlId The URL ID to validate
 * @param idLength Expected length (default: 6)
 * @returns True if valid, false otherwise
 */
export declare function validateUrlId(urlId: string, idLength?: number, isFrameworkMode?: boolean): boolean;
