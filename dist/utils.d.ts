/**
 * Utility functions for the opaque-urls package
 */
/**
 * Base62 alphabet for URL-safe ID generation
 * Contains: 0-9, A-Z, a-z (62 characters total)
 */
export declare const BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/**
 * Generate a Base62 ID of the specified length
 *
 * @param length Length of the ID to generate (default: 6)
 * @returns A random Base62 ID of the specified length
 */
export declare const generateBase62Id: (length?: number) => string;
/**
 * Build a complete entity URL from domain, entity type, and URL ID
 *
 * @param domain Base domain (e.g., 'longurl.co')
 * @param entityType Type of entity
 * @param urlId Generated URL ID
 * @returns Complete short URL
 */
export declare function buildEntityUrl(domain: string, entityType: string, urlId: string): string;
/**
 * Extract entity information from a URL path
 *
 * @param urlPath URL path like "/product/X7gT5p" or "/X7gT5p"
 * @param validEntityTypes Optional array of valid entity types for validation
 * @returns Parsed entity information or null if invalid
 */
export declare function parseEntityUrl(urlPath: string, validEntityTypes?: string[]): {
    entityType: string;
    urlId: string;
} | null;
/**
 * Validate if a string is a valid URL ID
 *
 * @param urlId String to validate
 * @param expectedLength Expected length (default: 6) - ignored for framework mode
 * @param isFrameworkMode Whether we're in framework mode (non-shortened URLs)
 * @returns True if valid Base62 string of correct length, or valid slug in framework mode
 */
export declare function isValidUrlId(urlId: string, expectedLength?: number, isFrameworkMode?: boolean): boolean;
/**
 * Create a URL-safe slug from an entity ID (for framework mode)
 *
 * @param entityId The entity ID to slugify
 * @returns URL-safe slug
 */
export declare function createEntitySlug(entityId: string): string;
