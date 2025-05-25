/**
 * Utility functions for the opaque-urls package
 */

import { customAlphabet } from 'nanoid';

/**
 * Base62 alphabet for URL-safe ID generation
 * Contains: 0-9, A-Z, a-z (62 characters total)
 */
export const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a Base62 ID of the specified length
 * 
 * @param length Length of the ID to generate (default: 6)
 * @returns A random Base62 ID of the specified length
 */
export const generateBase62Id = (length = 6): string => {
  const nanoid = customAlphabet(BASE62_ALPHABET, length);
  return nanoid();
};

/**
 * Build a complete entity URL from domain, entity type, and URL ID
 * 
 * @param domain Base domain (e.g., 'longurl.co')
 * @param entityType Type of entity
 * @param urlId Generated URL ID
 * @returns Complete short URL
 */
export function buildEntityUrl(domain: string, entityType: string, urlId: string): string {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  // For backward compatibility, include entity type in path
  return `https://${cleanDomain}/${entityType}/${urlId}`;
}

/**
 * Extract entity information from a URL path
 * 
 * @param urlPath URL path like "/product/X7gT5p" or "/X7gT5p"
 * @param validEntityTypes Optional array of valid entity types for validation
 * @returns Parsed entity information or null if invalid
 */
export function parseEntityUrl(
  urlPath: string, 
  validEntityTypes?: string[]
): { entityType: string; urlId: string } | null {
  // Remove leading slash
  const cleanPath = urlPath.replace(/^\//, '');
  
  // Split into parts
  const parts = cleanPath.split('/');
  
  if (parts.length === 2) {
    // Format: /entityType/urlId
    const [entityType, urlId] = parts;
    
    // Validate entity type if provided
    if (validEntityTypes && !validEntityTypes.includes(entityType)) {
      return null;
    }
    
    // Validate URL ID format
    if (!isValidUrlId(urlId)) {
      return null;
    }
    
    return { entityType, urlId };
  } else if (parts.length === 1) {
    // Format: /urlId (default entity type)
    const urlId = parts[0];
    
    // Validate URL ID format
    if (!isValidUrlId(urlId)) {
      return null;
    }
    
    return { entityType: 'default', urlId };
  }
  
  return null;
}

/**
 * Validate if a string is a valid URL ID
 * 
 * @param urlId String to validate
 * @param expectedLength Expected length (default: 6)
 * @returns True if valid Base62 string of correct length
 */
export function isValidUrlId(urlId: string, expectedLength = 6): boolean {
  if (!urlId || urlId.length !== expectedLength) {
    return false;
  }
  
  // Check if all characters are in Base62 alphabet
  return BASE62_ALPHABET.split('').some(char => urlId.includes(char)) &&
         urlId.split('').every(char => BASE62_ALPHABET.includes(char));
} 