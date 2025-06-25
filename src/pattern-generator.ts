/**
 * Pattern URL Generator
 * 
 * Handles URL pattern generation with placeholders like {endpointId}
 * Integrates with existing collision detection and error handling.
 */

import { 
  GenerationResult,
  DatabaseConfig,
} from '../types';
import { generateBase62Id } from '../utils';
import { checkCollision } from './collision';

/**
 * Generate a URL using a pattern with {endpointId} placeholder
 * 
 * @param entityType Type of entity (any string)
 * @param entityId Original entity ID (for metadata/context)
 * @param urlPattern Pattern with {endpointId} placeholder (e.g., 'weekend-emergency-plumber-austin-{endpointId}')
 * @param options Configuration options
 * @param dbConfig Database configuration for collision detection
 * @returns Generated URL and result info
 */
export async function generatePatternUrl(
  entityType: string,
  entityId: string,
  urlPattern: string,
  options: {
    idLength?: number;
    domain?: string;
    includeEntityInPath?: boolean;
    endpointId?: string;
  } = {},
  dbConfig: DatabaseConfig
): Promise<GenerationResult> {
  try {
    const { idLength = 6, domain = 'longurl.co', includeEntityInPath = false, endpointId: providedEndpointId } = options;
    
    // Validate pattern contains {endpointId} placeholder
    if (!urlPattern.includes('{endpointId}')) {
      return {
        urlId: '',
        shortUrl: '',
        success: false,
        error: 'URL pattern must contain {endpointId} placeholder'
      };
    }
    
    // Use provided endpointId or generate new one
    let endpointId = providedEndpointId || generateBase62Id(idLength);
    let attempts = 1;
    const MAX_ATTEMPTS = 5;
    let collisionCheckingAvailable = true;
    
    // If endpointId was provided, skip collision detection and use it directly
    if (providedEndpointId) {
      const urlId = urlPattern.replace('{endpointId}', endpointId);
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      
      const shortUrl = includeEntityInPath 
        ? `https://${cleanDomain}/${entityType}/${urlId}`
        : `https://${cleanDomain}/${urlId}`;
      
      return {
        urlId,
        shortUrl,
        success: true,
        entityType,
        entityId,
        originalUrl: shortUrl
      };
    }
    
    // Replace pattern and check for collisions
    while (attempts < MAX_ATTEMPTS && collisionCheckingAvailable) {
      // Replace {endpointId} with generated ID
      const urlId = urlPattern.replace('{endpointId}', endpointId);
      
      try {
        // Check collision on the full generated URL ID
        const collisionExists = await checkCollision(entityType, urlId, dbConfig);
        
        if (!collisionExists) {
          // No collision, build final URL and return
          const cleanDomain = domain.replace(/^https?:\/\//, '');
          
          const shortUrl = includeEntityInPath 
            ? `https://${cleanDomain}/${entityType}/${urlId}`
            : `https://${cleanDomain}/${urlId}`;
          
          return {
            urlId,
            shortUrl,
            success: true,
            entityType,
            entityId,
            originalUrl: shortUrl
          };
        }
        
        console.log(`Pattern collision detected for ${entityType}/${urlId}, regenerating (attempt ${attempts})...`);
        
        // Generate new endpointId and retry
        endpointId = generateBase62Id(idLength);
        attempts++;
        
      } catch (error) {
        // Database issue - degrade gracefully (same pattern as existing generator)
        console.log("⚠️  Database not fully configured:");
        console.log(`   ${error instanceof Error ? error.message : String(error)}`);
        console.log("💡 To fix: Ensure Supabase tables exist (run setup-tables.sql)");
        console.log("🎯 Continuing with pattern URL generation (no collision checking)");
        
        // Disable collision checking and use current endpointId
        collisionCheckingAvailable = false;
        
        const urlId = urlPattern.replace('{endpointId}', endpointId);
        const cleanDomain = domain.replace(/^https?:\/\//, '');
        
        const shortUrl = includeEntityInPath 
          ? `https://${cleanDomain}/${entityType}/${urlId}`
          : `https://${cleanDomain}/${urlId}`;
        
        return {
          urlId,
          shortUrl,
          success: true,
          entityType,
          entityId,
          originalUrl: shortUrl
        };
      }
    }
    
    // If we hit max attempts with collision checking enabled, return error
    if (attempts >= MAX_ATTEMPTS && collisionCheckingAvailable) {
      return {
        urlId: '',
        shortUrl: '',
        success: false,
        error: `Failed to generate unique pattern URL after ${MAX_ATTEMPTS} attempts`
      };
    }
    
    // Fallback (shouldn't reach here, but safety)
    return {
      urlId: '',
      shortUrl: '',
      success: false,
      error: 'Unexpected error in pattern generation'
    };
    
  } catch (error) {
    return {
      urlId: '',
      shortUrl: '',
      success: false,
      error: `Error generating pattern URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate a URL pattern
 * 
 * @param pattern Pattern to validate
 * @returns True if valid, false otherwise
 */
export function validateUrlPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }
  
  // Must contain {endpointId} placeholder
  if (!pattern.includes('{endpointId}')) {
    return false;
  }
  
  // Should not contain other unsupported placeholders for now
  const supportedPlaceholders = ['{endpointId}'];
  const allPlaceholders = pattern.match(/\{[^}]+\}/g) || [];
  
  return allPlaceholders.every(placeholder => 
    supportedPlaceholders.includes(placeholder)
  );
} 