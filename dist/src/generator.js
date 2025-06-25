"use strict";
/**
 * URL Generator
 *
 * Generates unique URL IDs for any entity types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUrlId = generateUrlId;
exports.validateUrlId = validateUrlId;
const types_1 = require("../types");
const utils_1 = require("../utils");
const collision_1 = require("./collision");
const pattern_generator_1 = require("./pattern-generator");
/**
 * Generate a URL ID for an entity
 *
 * @param entityType Type of entity (any string)
 * @param entityId Original entity ID
 * @param options Configuration options
 * @returns Generated URL and result info
 */
async function generateUrlId(entityType, entityId, options = {}, dbConfig = types_1.DEFAULT_DB_CONFIG) {
    try {
        const { idLength = 6, domain = 'longurl.co', enableShortening = true, includeEntityInPath = false, urlPattern, endpointId } = options;
        // NEW: Pattern-based URL generation
        if (urlPattern) {
            return (0, pattern_generator_1.generatePatternUrl)(entityType, entityId, urlPattern, {
                idLength,
                domain,
                includeEntityInPath,
                endpointId
            }, dbConfig);
        }
        // Framework Mode: Use provided endpointId or entity ID directly instead of generating random ID
        if (!enableShortening) {
            const urlId = endpointId || (0, utils_1.createEntitySlug)(entityId);
            // Skip collision checking if endpointId was provided (developer's responsibility)
            if (!endpointId) {
                // Still check for collisions in framework mode when using entity ID
                try {
                    const collisionExists = await (0, collision_1.checkCollision)(entityType, urlId, dbConfig);
                    if (collisionExists) {
                        return {
                            urlId: '',
                            shortUrl: '',
                            success: false,
                            error: `Entity ID "${entityId}" conflicts with existing URL. Entity IDs must be unique within entity type "${entityType}".`
                        };
                    }
                }
                catch (error) {
                    // Database not configured - continue without collision checking
                    console.log("⚠️  Database not fully configured for collision checking in framework mode");
                    console.log(`   ${error instanceof Error ? error.message : String(error)}`);
                    console.log("🎯 Continuing with framework URL generation");
                }
            }
            // Build the URL (respect includeEntityInPath setting)
            const shortUrl = includeEntityInPath
                ? (0, utils_1.buildEntityUrl)(domain, entityType, urlId)
                : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
            return {
                urlId,
                shortUrl,
                success: true,
                entityType,
                entityId,
                originalUrl: shortUrl
            };
        }
        // Shortening Mode: Use provided endpointId or generate random Base62 ID
        let urlId = endpointId || (0, utils_1.generateBase62Id)(idLength);
        let attempts = 1;
        const MAX_ATTEMPTS = 5;
        let collisionCheckingAvailable = true;
        // If endpointId was provided, skip collision detection and use it directly
        if (endpointId) {
            // Build the URL (respect includeEntityInPath setting)
            const shortUrl = includeEntityInPath
                ? (0, utils_1.buildEntityUrl)(domain, entityType, urlId)
                : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
            return {
                urlId,
                shortUrl,
                success: true,
                entityType,
                entityId,
                originalUrl: shortUrl
            };
        }
        // Check for collisions and regenerate if necessary
        while (attempts < MAX_ATTEMPTS && collisionCheckingAvailable) {
            try {
                // Always attempt database collision checking first
                const collisionExists = await (0, collision_1.checkCollision)(entityType, urlId, dbConfig);
                if (!collisionExists) {
                    // No collision, we can use this ID
                    break;
                }
                console.log(`Collision detected for ${entityType}/${urlId}, regenerating (attempt ${attempts})...`);
                // Generate a new ID
                urlId = (0, utils_1.generateBase62Id)(idLength);
                attempts++;
            }
            catch (error) {
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
            ? (0, utils_1.buildEntityUrl)(domain, entityType, urlId)
            : `https://${domain.replace(/^https?:\/\//, '')}/${urlId}`;
        // Return the successfully generated ID
        return {
            urlId,
            shortUrl,
            success: true,
            entityType,
            entityId,
            originalUrl: shortUrl
        };
    }
    catch (error) {
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
function validateUrlId(urlId, idLength = 6, isFrameworkMode = false) {
    return (0, utils_1.isValidUrlId)(urlId, idLength, isFrameworkMode);
}
