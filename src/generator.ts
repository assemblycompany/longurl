/**
 * Opaque URL Generator
 * 
 * Generates unique, opaque URL IDs for various entity types.
 */

import { 
  EntityType, 
  OpaqueUrlConfig, 
  DEFAULT_CONFIG, 
  GenerationResult,
  DatabaseConfig,
  DEFAULT_DB_CONFIG
} from '../types';
import { generateBase62Id, isValidUrlId, buildEntityUrl } from '../utils';
import { checkCollision } from './collision';

/**
 * Generate an opaque URL ID for an entity
 * 
 * @param entityType Type of entity (insider, company, etc.)
 * @param entityId Original entity ID
 * @param config Configuration options
 * @returns Generated URL and result info
 */
export async function generateUrlId(
  entityType: EntityType,
  entityId: string,
  config: OpaqueUrlConfig = {},
  dbConfig: DatabaseConfig = DEFAULT_DB_CONFIG
): Promise<GenerationResult> {
  try {
    // Merge with default configuration
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { idLength = 6 } = finalConfig;
    const domain = config.domain || 'longurl.co';
    
    // Generate initial opaque ID
    let urlId = generateBase62Id(idLength);
    let attempts = 1;
    const MAX_ATTEMPTS = 5;
    
    // Check for collisions and regenerate if necessary
    while (attempts < MAX_ATTEMPTS) {
      // Check if this ID already exists for this entity type
      const collisionExists = await checkCollision(entityType, urlId, dbConfig);
      
      if (!collisionExists) {
        // No collision, we can use this ID
        break;
      }
      
      console.log(`Collision detected for ${entityType}/${urlId}, regenerating (attempt ${attempts})...`);
      
      // Generate a new ID
      urlId = generateBase62Id(idLength);
      attempts++;
    }
    
    // If we hit max attempts, return error
    if (attempts >= MAX_ATTEMPTS) {
      return {
        urlId: '',
        shortUrl: '',
        success: false,
        error: `Failed to generate unique ID after ${MAX_ATTEMPTS} attempts`
      };
    }
    
    // Build the short URL
    const shortUrl = buildEntityUrl(domain, entityType, urlId);
    
    // Return the successfully generated ID
    return {
      urlId,
      shortUrl,
      success: true
    };
  } catch (error) {
    return {
      urlId: '',
      shortUrl: '',
      success: false,
      error: `Error generating opaque URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate whether a string is a valid opaque URL ID
 * 
 * @param urlId The URL ID to validate
 * @param idLength Expected length (default: 6)
 * @returns True if valid, false otherwise
 */
export function validateUrlId(urlId: string, idLength = 6): boolean {
  return isValidUrlId(urlId, idLength);
} 