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
 * Extract entity information from a URL path
 *
 * @param urlPath URL path like "/product/X7gT5p" or "/X7gT5p"
 * @param validEntityTypes Optional array of valid entity types to validate against
 * @returns Object with entityType and urlId, or null if invalid
 */
export declare const parseEntityUrl: (urlPath: string, validEntityTypes?: string[]) => {
    entityType: string;
    urlId: string;
} | null;
/**
 * Build a complete URL for an entity
 *
 * @param entityType Type of entity (or 'default' for non-entity URLs)
 * @param urlId The URL ID
 * @param baseUrl Optional base URL (default: "")
 * @returns Complete URL string
 */
export declare const buildEntityUrl: (entityType: string, urlId: string, baseUrl?: string) => string;
/**
 * Check if a string looks like a valid URL ID
 *
 * @param str String to validate
 * @param length Expected length (default: 6)
 * @returns True if the string looks like a URL ID
 */
export declare const isValidUrlId: (str: string, length?: number) => boolean;
