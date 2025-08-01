/**
 * Pattern URL Generator
 * 
 * Handles URL pattern generation with placeholders like {publicId}
 * Integrates with existing collision detection and error handling.
 */

import { 
  GenerationResult,
  DatabaseConfig,
  UrlGenerationOptions
} from '../types';
import { generateBase62Id } from '../utils';
import { checkCollision } from './collision';
import { generateOptimizedQRCode } from './qr-generator';

/**
 * Generate a URL using a pattern with {publicId} placeholder
 * 
 * @param entityType Type of entity (any string)
 * @param entityId Original entity ID (for metadata/context)
 * @param urlPattern Pattern with {publicId} placeholder (e.g., 'weekend-emergency-plumber-austin-{publicId}')
 * @param options Configuration options
 * @param dbConfig Database configuration for collision detection
 * @returns Generated URL and result info
 */
export async function generatePatternUrl(
  entityType: string,
  entityId: string,
  urlPattern: string,
  options: UrlGenerationOptions = {},
  dbConfig: DatabaseConfig
): Promise<GenerationResult> {
  try {
    const { idLength = 6, domain = 'longurl.co', includeEntityInPath = false, publicId: providedPublicId, endpointId: providedEndpointId, includeInSlug = true, generate_qr_code = true } = options;
    
    // Support both publicId (new) and endpointId (deprecated) for backward compatibility
    const publicId = providedPublicId || providedEndpointId;
    
    // Validate pattern contains {publicId} placeholder (NEW) or {endpointId} placeholder (DEPRECATED)
    const hasPublicIdPlaceholder = urlPattern.includes('{publicId}');
    const hasEndpointIdPlaceholder = urlPattern.includes('{endpointId}');
    
    if (!hasPublicIdPlaceholder && !hasEndpointIdPlaceholder) {
      return {
        urlId: '',
        shortUrl: '',
        success: false,
        error: 'URL pattern must contain {publicId} placeholder (or {endpointId} for backward compatibility)'
      };
    }
    
    // Use provided publicId or generate new one
    let finalPublicId = providedPublicId || generateBase62Id(idLength);
    let urlId: string;
    
    // Handle includeInSlug option for pattern URLs
    if (!includeInSlug) {
      // Remove trailing dash + placeholder as a unit
      urlId = urlPattern.replace(/-{publicId}/, '').replace(/-{endpointId}/, '');
    } else {
      // Use publicId in the pattern (default behavior)
      urlId = hasPublicIdPlaceholder 
        ? urlPattern.replace('{publicId}', finalPublicId)
        : urlPattern.replace('{endpointId}', finalPublicId);
    }
    let attempts = 1;
    const MAX_ATTEMPTS = 5;
    let collisionCheckingAvailable = true;
    
    // If publicId was provided and includeInSlug is true, skip collision detection
    if (providedPublicId && includeInSlug) {
      // Replace placeholder with provided publicId
      const urlId = hasPublicIdPlaceholder 
        ? urlPattern.replace('{publicId}', finalPublicId)
        : urlPattern.replace('{endpointId}', finalPublicId);
      
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      
      const shortUrl = includeEntityInPath 
        ? `https://${cleanDomain}/${entityType}/${urlId}`
        : `https://${cleanDomain}/${urlId}`;
      
      // Generate QR code if enabled
      let qrCode: string | undefined;
      if (generate_qr_code) {
        try {
          qrCode = await generateOptimizedQRCode(shortUrl);
        } catch (error) {
          console.log("⚠️  QR code generation failed, continuing without QR code");
          console.log(`   ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Always generate a short URL slug for easy sharing
      const urlSlugShort = generateBase62Id(idLength);
      
      return {
        urlId,
        shortUrl,
        success: true,
        entityType,
        entityId,
        originalUrl: shortUrl,
        publicId: finalPublicId,
        qrCode,
        url_slug_short: urlSlugShort
      };
    }
    
    // Replace pattern and check for collisions
    while (attempts < MAX_ATTEMPTS && collisionCheckingAvailable) {
      // Determine what to use in URL slug based on includeInSlug
      if (!includeInSlug) {
        // Remove trailing dash + placeholder as a unit
        urlId = urlPattern.replace(/-{publicId}/, '').replace(/-{endpointId}/, '');
      } else {
        // Use publicId in the pattern
        urlId = hasPublicIdPlaceholder 
          ? urlPattern.replace('{publicId}', finalPublicId)
          : urlPattern.replace('{endpointId}', finalPublicId);
      }
      
      try {
        // Check collision on the full generated URL ID
        const collisionExists = await checkCollision(entityType, urlId, dbConfig);
        
        if (!collisionExists) {
          // No collision, build final URL and return
          const cleanDomain = domain.replace(/^https?:\/\//, '');
          
          const shortUrl = includeEntityInPath 
            ? `https://${cleanDomain}/${entityType}/${urlId}`
            : `https://${cleanDomain}/${urlId}`;
          
          // Generate QR code if enabled
          let qrCode: string | undefined;
          if (generate_qr_code) {
            try {
              qrCode = await generateOptimizedQRCode(shortUrl);
            } catch (error) {
              console.log("⚠️  QR code generation failed, continuing without QR code");
              console.log(`   ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          
          // Always generate a short URL slug for easy sharing
          const urlSlugShort = generateBase62Id(idLength);
          
          return {
            urlId,
            shortUrl,
            success: true,
            entityType,
            entityId,
            originalUrl: shortUrl,
            publicId: finalPublicId,
            qrCode,
            url_slug_short: urlSlugShort
          };
        }
        
        console.log(`Pattern collision detected for ${entityType}/${urlId}, regenerating (attempt ${attempts})...`);
        
        // Generate new publicId and retry
        finalPublicId = generateBase62Id(idLength);
        attempts++;
        
        // Recalculate urlId with new publicId, respecting includeInSlug
        const slugValue = !includeInSlug ? '' : finalPublicId;
        urlId = hasPublicIdPlaceholder 
          ? urlPattern.replace('{publicId}', slugValue)
          : urlPattern.replace('{endpointId}', slugValue);
        
      } catch (error) {
        // Database issue - degrade gracefully (same pattern as existing generator)
        console.log("⚠️  Database not fully configured:");
        console.log(`   ${error instanceof Error ? error.message : String(error)}`);
        console.log("💡 To fix: Ensure Supabase tables exist (run setup-tables.sql)");
        console.log("🎯 Continuing with pattern URL generation (no collision checking)");
        
        // Disable collision checking and use current publicId
        collisionCheckingAvailable = false;
        
        // Respect includeInSlug setting even in error fallback
        if (!includeInSlug) {
          // Remove trailing dash + placeholder as a unit
          urlId = urlPattern.replace(/-{publicId}/, '').replace(/-{endpointId}/, '');
        } else {
          // Use publicId in the pattern
          urlId = hasPublicIdPlaceholder 
            ? urlPattern.replace('{publicId}', finalPublicId)
            : urlPattern.replace('{endpointId}', finalPublicId);
        }
        
        const cleanDomain = domain.replace(/^https?:\/\//, '');
        
        const shortUrl = includeEntityInPath 
          ? `https://${cleanDomain}/${entityType}/${urlId}`
          : `https://${cleanDomain}/${urlId}`;
        
        // Generate QR code if enabled
        let qrCode: string | undefined;
        if (generate_qr_code) {
          try {
            qrCode = await generateOptimizedQRCode(shortUrl);
          } catch (error) {
            console.log("⚠️  QR code generation failed, continuing without QR code");
            console.log(`   ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        
        // Always generate a short URL slug for easy sharing
        const urlSlugShort = generateBase62Id(idLength);
        
        return {
          urlId,
          shortUrl,
          success: true,
          entityType,
          entityId,
          originalUrl: shortUrl,
          publicId: finalPublicId,
          qrCode,
          url_slug_short: urlSlugShort
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
  
  // Must contain {publicId} placeholder (NEW) or {endpointId} placeholder (DEPRECATED)
  const hasPublicIdPlaceholder = pattern.includes('{publicId}');
  const hasEndpointIdPlaceholder = pattern.includes('{endpointId}');
  
  if (!hasPublicIdPlaceholder && !hasEndpointIdPlaceholder) {
    return false;
  }
  
  // Should not contain other unsupported placeholders for now
  const supportedPlaceholders = ['{publicId}', '{endpointId}'];
  const allPlaceholders = pattern.match(/\{[^}]+\}/g) || [];
  
  return allPlaceholders.every(placeholder => 
    supportedPlaceholders.includes(placeholder)
  );
} 