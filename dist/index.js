"use strict";
/**
 * Opaque URLs Package
 *
 * This package provides tools for generating and managing opaque URLs
 * for entities in the InsiderDrops platform.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LongURL = void 0;
// Export types
__exportStar(require("./types"), exports);
// Export core functionality
__exportStar(require("./src/generator"), exports);
__exportStar(require("./src/resolver"), exports);
__exportStar(require("./src/collision"), exports);
// Export utilities
__exportStar(require("./utils"), exports);
/**
 * LongURL Package
 *
 * Programmable URL shortener for developers - infra-as-code for URLs
 */
const supabase_js_1 = require("@supabase/supabase-js");
const types_1 = require("./types");
const utils_1 = require("./utils");
const collision_1 = require("./src/collision");
/**
 * Main LongURL class for URL shortening and management
 */
class LongURL {
    constructor(config) {
        // Merge with defaults
        this.config = {
            ...types_1.DEFAULT_CONFIG,
            ...config,
            database: {
                ...types_1.DEFAULT_DB_CONFIG,
                ...config.database
            }
        };
        // Initialize Supabase client
        this.supabase = (0, supabase_js_1.createClient)(this.config.database.connection.url, this.config.database.connection.key);
    }
    /**
     * Shorten a URL with optional entity context
     */
    async shorten(originalUrl, options) {
        try {
            // Validate entity type if provided
            if ((options === null || options === void 0 ? void 0 : options.entityType) && !this.config.entities[options.entityType]) {
                return {
                    urlId: '',
                    shortUrl: '',
                    success: false,
                    error: `Unknown entity type: ${options.entityType}`
                };
            }
            // Generate URL ID with collision detection
            let urlId = (0, utils_1.generateBase62Id)(this.config.idLength || 6);
            let attempts = 1;
            const MAX_ATTEMPTS = 5;
            while (attempts < MAX_ATTEMPTS) {
                const collisionExists = await (0, collision_1.checkCollision)((options === null || options === void 0 ? void 0 : options.entityType) || 'default', urlId, this.config.database);
                if (!collisionExists)
                    break;
                urlId = (0, utils_1.generateBase62Id)(this.config.idLength || 6);
                attempts++;
            }
            if (attempts >= MAX_ATTEMPTS) {
                return {
                    urlId: '',
                    shortUrl: '',
                    success: false,
                    error: `Failed to generate unique ID after ${MAX_ATTEMPTS} attempts`
                };
            }
            // Store the URL
            await this.storeUrl(urlId, originalUrl, options);
            // Build the complete short URL
            const domain = this.config.domain || this.config.baseUrl || 'https://longurl.co';
            const shortUrl = (options === null || options === void 0 ? void 0 : options.entityType)
                ? (0, utils_1.buildEntityUrl)(options.entityType, urlId, domain)
                : `${domain}/${urlId}`;
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
                error: `Error shortening URL: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Resolve a short URL back to its original URL and increment click count
     */
    async resolve(urlId) {
        try {
            if (!(0, utils_1.isValidUrlId)(urlId, this.config.idLength)) {
                return {
                    success: false,
                    error: 'Invalid URL ID format'
                };
            }
            const tableName = this.config.database.lookupTable || 'short_urls';
            // Get the URL record and increment click count
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .eq('url_id', urlId)
                .single();
            if (error || !data) {
                return {
                    success: false,
                    error: 'URL not found'
                };
            }
            // Increment click count
            await this.supabase
                .from(tableName)
                .update({
                click_count: (data.click_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
                .eq('url_id', urlId);
            // If entity context exists, fetch the entity
            let entity = undefined;
            if (data.entity_type && data.entity_id && this.config.entities[data.entity_type]) {
                const entityConfig = this.config.entities[data.entity_type];
                const { data: entityData } = await this.supabase
                    .from(entityConfig.tableName)
                    .select('*')
                    .eq(entityConfig.primaryKey, data.entity_id)
                    .single();
                entity = entityData;
            }
            return {
                originalUrl: data.original_url,
                entity,
                entityId: data.entity_id,
                entityType: data.entity_type,
                clickCount: (data.click_count || 0) + 1,
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Error resolving URL: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Get analytics for URLs
     */
    async analytics(entityType) {
        const tableName = this.config.database.lookupTable || 'short_urls';
        let query = this.supabase
            .from(tableName)
            .select('url_id, entity_type, click_count, created_at');
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        const { data } = await query;
        if (!data) {
            return {
                totalClicks: 0,
                clicksByEntity: {},
                recentClicks: []
            };
        }
        const totalClicks = data.reduce((sum, record) => sum + (record.click_count || 0), 0);
        const clicksByEntity = {};
        data.forEach((record) => {
            const type = record.entity_type || 'default';
            clicksByEntity[type] = (clicksByEntity[type] || 0) + (record.click_count || 0);
        });
        const recentClicks = data
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map((record) => ({
            urlId: record.url_id,
            entityType: record.entity_type,
            clickedAt: record.created_at
        }));
        return {
            totalClicks,
            clicksByEntity,
            recentClicks
        };
    }
    /**
     * Store URL in database
     */
    async storeUrl(urlId, originalUrl, options) {
        const tableName = this.config.database.lookupTable || 'short_urls';
        await this.supabase
            .from(tableName)
            .insert({
            url_id: urlId,
            original_url: originalUrl,
            entity_id: options === null || options === void 0 ? void 0 : options.entityId,
            entity_type: options === null || options === void 0 ? void 0 : options.entityType,
            click_count: 0,
            metadata: options === null || options === void 0 ? void 0 : options.metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }
}
exports.LongURL = LongURL;
// Export types for users
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
