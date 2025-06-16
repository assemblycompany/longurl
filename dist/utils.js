"use strict";
/**
 * Utility functions for the opaque-urls package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBase62Id = exports.BASE62_ALPHABET = void 0;
exports.buildEntityUrl = buildEntityUrl;
exports.parseEntityUrl = parseEntityUrl;
exports.isValidUrlId = isValidUrlId;
exports.createEntitySlug = createEntitySlug;
const nanoid_1 = require("nanoid");
/**
 * Base62 alphabet for URL-safe ID generation
 * Contains: 0-9, A-Z, a-z (62 characters total)
 */
exports.BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/**
 * Generate a Base62 ID of the specified length
 *
 * @param length Length of the ID to generate (default: 6)
 * @returns A random Base62 ID of the specified length
 */
const generateBase62Id = (length = 6) => {
    const nanoid = (0, nanoid_1.customAlphabet)(exports.BASE62_ALPHABET, length);
    return nanoid();
};
exports.generateBase62Id = generateBase62Id;
/**
 * Build a complete entity URL from domain, entity type, and URL ID
 *
 * @param domain Base domain (e.g., 'longurl.co')
 * @param entityType Type of entity
 * @param urlId Generated URL ID
 * @returns Complete short URL
 */
function buildEntityUrl(domain, entityType, urlId) {
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
function parseEntityUrl(urlPath, validEntityTypes) {
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
    }
    else if (parts.length === 1) {
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
 * @param expectedLength Expected length (default: 6) - ignored for framework mode
 * @param isFrameworkMode Whether we're in framework mode (non-shortened URLs)
 * @returns True if valid Base62 string of correct length, or valid slug in framework mode
 */
function isValidUrlId(urlId, expectedLength = 6, isFrameworkMode = false) {
    if (!urlId) {
        return false;
    }
    if (isFrameworkMode) {
        // Framework mode: accept URL-safe slugs (alphanumeric, hyphens, underscores)
        return /^[a-zA-Z0-9_-]+$/.test(urlId) && urlId.length <= 100; // reasonable max length
    }
    // Shortening mode: strict Base62 validation
    if (urlId.length !== expectedLength) {
        return false;
    }
    // Check if all characters are in Base62 alphabet
    return exports.BASE62_ALPHABET.split('').some(char => urlId.includes(char)) &&
        urlId.split('').every(char => exports.BASE62_ALPHABET.includes(char));
}
/**
 * Create a URL-safe slug from an entity ID (for framework mode)
 *
 * @param entityId The entity ID to slugify
 * @returns URL-safe slug
 */
function createEntitySlug(entityId) {
    return entityId
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
