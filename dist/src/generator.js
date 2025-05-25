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
        const { idLength = 6, domain = 'longurl.co' } = options;
        // Generate initial URL ID
        let urlId = (0, utils_1.generateBase62Id)(idLength);
        let attempts = 1;
        const MAX_ATTEMPTS = 5;
        // Check for collisions and regenerate if necessary
        while (attempts < MAX_ATTEMPTS) {
            // Check if this ID already exists for this entity type
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
        // If we hit max attempts, return error
        if (attempts >= MAX_ATTEMPTS) {
            return {
                urlId: '',
                shortUrl: '',
                success: false,
                error: `Failed to generate unique ID after ${MAX_ATTEMPTS} attempts`
            };
        }
        // Build the short URL
        const shortUrl = (0, utils_1.buildEntityUrl)(domain, entityType, urlId);
        // Return the successfully generated ID
        return {
            urlId,
            shortUrl,
            success: true
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
function validateUrlId(urlId, idLength = 6) {
    return (0, utils_1.isValidUrlId)(urlId, idLength);
}
