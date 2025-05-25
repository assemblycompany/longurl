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
 * Extract entity information from a URL path
 * 
 * @param urlPath URL path like "/product/X7gT5p" or "/X7gT5p"
 * @param validEntityTypes Optional array of valid entity types to validate against
 * @returns Object with entityType and urlId, or null if invalid
 */
export const parseEntityUrl = (
  urlPath: string, 
  validEntityTypes?: string[]
): { entityType: string; urlId: string } | null => {
  // Clean up the path
  const path = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
  
  // Split path into segments
  const segments = path.split('/');
  
  // If only one segment, it's a direct URL ID without entity type
  if (segments.length === 1) {
    return { entityType: 'default', urlId: segments[0] };
  }
  
  // Need at least type and ID segments for entity URLs
  if (segments.length < 2) {
    return null;
  }
  
  const typeSegment = segments[0].toLowerCase();
  const urlId = segments[1];
  
  // Validate that the type segment is in the valid entity types (if provided)
  if (validEntityTypes && !validEntityTypes.includes(typeSegment)) {
    return null;
  }
  
  if (!urlId) {
    return null;
  }
  
  return { entityType: typeSegment, urlId };
};

/**
 * Build a complete URL for an entity
 * 
 * @param entityType Type of entity (or 'default' for non-entity URLs)
 * @param urlId The URL ID
 * @param baseUrl Optional base URL (default: "")
 * @returns Complete URL string
 */
export const buildEntityUrl = (
  entityType: string,
  urlId: string,
  baseUrl = ''
): string => {
  // Ensure baseUrl has trailing slash if provided
  const base = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`) : '';
  
  // For default entity type, don't include the entity prefix
  if (entityType === 'default') {
    return `${base}${urlId}`;
  }
  
  return `${base}${entityType}/${urlId}`;
};

/**
 * Check if a string looks like a valid URL ID
 * 
 * @param str String to validate
 * @param length Expected length (default: 6)
 * @returns True if the string looks like a URL ID
 */
export const isValidUrlId = (str: string, length = 6): boolean => {
  if (!str || typeof str !== 'string' || str.length !== length) {
    return false;
  }
  
  // Ensure all characters are in BASE62_ALPHABET
  for (const char of str) {
    if (!BASE62_ALPHABET.includes(char)) {
      return false;
    }
  }
  
  return true;
}; 