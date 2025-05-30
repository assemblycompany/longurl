/**
 * URL Generator
 * 
 * Generates unique URL IDs for any entity types.
 */

import { 
  GenerationResult,
  DatabaseConfig,
  DEFAULT_DB_CONFIG
} from '../types';
import { generateBase62Id, isValidUrlId, buildEntityUrl } from '../utils';
import { checkCollision } from './collision';

/**
 * Generate a URL ID for an entity
 * 
 * @param entityType Type of entity (any string)
 * @param entityId Original entity ID
 * @param options Configuration options
 * @returns Generated URL and result info
 */
export async function generateUrlId(
  entityType: string,
  entityId: string,
  options: {
    idLength?: number;
    domain?: string;
  } = {},
  dbConfig: DatabaseConfig = DEFAULT_DB_CONFIG
): Promise<GenerationResult> {
  try {
    const { idLength = 6, domain = 'longurl.co' } = options;
    
    // Generate initial URL ID
    let urlId = generateBase62Id(idLength);
    let attempts = 1;
    const MAX_ATTEMPTS = 5;
    let collisionCheckingAvailable = true;
    
    // Check for collisions and regenerate if necessary
    while (attempts < MAX_ATTEMPTS && collisionCheckingAvailable) {
      try {
        // Always attempt database collision checking first
        const collisionExists = await checkCollision(entityType, urlId, dbConfig);
        
        if (!collisionExists) {
          // No collision, we can use this ID
          break;
        }
        
        console.log(`Collision detected for ${entityType}/${urlId}, regenerating (attempt ${attempts})...`);
        
        // Generate a new ID
        urlId = generateBase62Id(idLength);
        attempts++;
        
      } catch (error) {
        // Database issue - degrade gracefully
        console.log("⚠️  Database not fully configured:");
        console.log(`   ${error instanceof Error ? error.message : String(error)}`);
        console.log("💡 To fix: Ensure Supabase tables exist (run setup-tables.sql)");
        console.log("🎯 Continuing with URL generation (no collision checking)");
        
        // Disable collision checking for remaining attempts
        collisionCheckingAvailable = false;
        break;
      }
    }
    
    // If we hit max attempts with collision checking enabled, return error
    if (attempts >= MAX_ATTEMPTS && collisionCheckingAvailable) {
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
      success: true,
      entityType,
      entityId,
      originalUrl: shortUrl
    };
  } catch (error) {
    return {
      urlId: '',
      shortUrl: '',
      success: false,
      error: `Error generating URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate whether a string is a valid URL ID
 * 
 * @param urlId The URL ID to validate
 * @param idLength Expected length (default: 6)
 * @returns True if valid, false otherwise
 */
export function validateUrlId(urlId: string, idLength = 6): boolean {
  return isValidUrlId(urlId, idLength);
} 