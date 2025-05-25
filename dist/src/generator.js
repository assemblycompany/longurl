"use strict";
/**
 * Opaque URL Generator
 *
 * Generates unique, opaque URL IDs for various entity types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUrlId = generateUrlId;
exports.validateUrlId = validateUrlId;
const types_1 = require("../types");
const utils_1 = require("../utils");
const collision_1 = require("./collision");
/**
 * Generate an opaque URL ID for an entity
 *
 * @param entityType Type of entity (insider, company, etc.)
 * @param entityId Original entity ID
 * @param config Configuration options
 * @returns Generated URL and result info
 */
async function generateUrlId(entityType, entityId, config = types_1.DEFAULT_CONFIG, dbConfig = types_1.DEFAULT_DB_CONFIG) {
    try {
        // Merge with default configuration
        const finalConfig = { ...types_1.DEFAULT_CONFIG, ...config };
        const { idLength = 6 } = finalConfig;
        // Generate initial opaque ID
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
                success: false,
                error: `Failed to generate unique ID after ${MAX_ATTEMPTS} attempts`
            };
        }
        // Return the successfully generated ID
        return {
            urlId,
            success: true
        };
    }
    catch (error) {
        return {
            urlId: '',
            success: false,
            error: `Error generating opaque URL: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
/**
 * Validate whether a string is a valid opaque URL ID
 *
 * @param urlId The URL ID to validate
 * @param idLength Expected length (default: 6)
 * @returns True if valid, false otherwise
 */
function validateUrlId(urlId, idLength = 6) {
    return (0, utils_1.isValidUrlId)(urlId, idLength);
}
