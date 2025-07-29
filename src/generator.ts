/**
 * URL Generator
 * 
 * Generates unique URL IDs for any entity types.
 */

import { 
  GenerationResult,
  DatabaseConfig,
  UrlGenerationOptions,
  DEFAULT_DB_CONFIG
} from '../types';
import { generateBase62Id, createEntitySlug, buildEntityUrl, isValidUrlId } from '../utils';
import { checkCollision } from './collision';
import { generatePatternUrl } from './pattern-generator';

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
  options: UrlGenerationOptions = {},
  dbConfig: DatabaseConfig = DEFAULT_DB_CONFIG
): Promise<GenerationResult> {
  try {
    const { idLength = 6, domain = 'longurl.co', enableShortening = true, includeEntityInPath = false, urlPattern, publicId: providedPublicId, endpointId: providedEndpointId, includeInSlug = true } = options;
    
    // Support both publicId (new) and endpointId (deprecated) for backward compatibility
    const publicId = providedPublicId || providedEndpointId;
    
    // NEW: Pattern-based URL generation
    if (urlPattern) {
      return generatePatternUrl(entityType, entityId, urlPattern, {
        idLength,
        domain,
        includeEntityInPath,
        publicId  // NEW: Use publicId parameter
      }, dbConfig);
    }
    
    // Framework Mode: Use provided publicId or entity ID directly instead of generating random ID
    if (!enableShortening) {
      let urlId: string;
      let finalPublicId: string;
      
      if (publicId) {
        // Developer provided publicId
        finalPublicId = publicId;
        urlId = includeInSlug ? publicId : generateBase62Id(idLength);
      } else {
        // Use entity ID
        finalPublicId = createEntitySlug(entityId);
        urlId = includeInSlug ? finalPublicId : generateBase62Id(idLength);
      }
      
      // Skip collision checking if publicId was provided (developer's responsibility)
      if (!publicId) {
        // Still check for collisions in framework mode when using entity ID
        try {
          const collisionExists = await checkCollision(entityType, urlId, dbConfig);
          if (collisionExists) {
            return {
              urlId: '',
              shortUrl: '',
              success: false,
              error: `Entity ID "${entityId}" conflicts with existing URL. Entity IDs must be unique within entity type "${entityType}".`
            };
          }
        } catch (error) {
          // Database not configured - continue without collision checking
          console.log("⚠️  Database not fully configured for collision checking in framework mode");
          console.log(`   ${error instanceof Error ? error.message : String(error)}`);
          console.log("🎯 Continuing with framework URL generation");
        }
      }
      
      // Build the URL (respect includeEntityInPath setting)
      const shortUrl = includeEntityInPath 
        ? buildEntityUrl(domain, entityType, urlId)
        : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
      
      return {
        urlId,
        shortUrl,
        success: true,
        entityType,
        entityId,
        originalUrl: shortUrl,
        publicId: finalPublicId
      };
    }
    
    // Shortening Mode: Generate random Base62 ID
    let urlId = publicId || generateBase62Id(idLength);
    let attempts = 1;
    const MAX_ATTEMPTS = 5;
    let collisionCheckingAvailable = true;
    
    // If publicId was provided, skip collision detection
    if (publicId) {
      // Build the URL (respect includeEntityInPath setting)
      const shortUrl = includeEntityInPath 
        ? buildEntityUrl(domain, entityType, urlId)
        : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
      
      return {
        urlId,
        shortUrl,
        success: true,
        entityType,
        entityId,
        originalUrl: shortUrl,
        publicId: urlId  // In shortening mode, urlId IS the publicId
      };
    }
    
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
    
    // Build the short URL (respect includeEntityInPath setting)
    const shortUrl = includeEntityInPath 
      ? buildEntityUrl(domain, entityType, urlId)
      : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
    
    // Return the successfully generated ID
    return {
      urlId,
      shortUrl,
      success: true,
      entityType,
      entityId,
      originalUrl: shortUrl,
      publicId: urlId  // In shortening mode, urlId IS the publicId
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
export function validateUrlId(urlId: string, idLength = 6, isFrameworkMode = false): boolean {
  return isValidUrlId(urlId, idLength, isFrameworkMode);
} 