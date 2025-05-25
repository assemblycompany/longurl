/**
 * Opaque URLs Package
 *
 * This package provides tools for generating and managing opaque URLs
 * for entities in the InsiderDrops platform.
 */
export * from './types';
export * from './src/generator';
export * from './src/resolver';
export * from './src/collision';
export * from './utils';
import { LongURLConfig, GenerationResult, ResolutionResult, AnalyticsData } from './types';
/**
 * Main LongURL class for URL shortening and management
 */
export declare class LongURL {
    private config;
    private supabase;
    constructor(config: LongURLConfig);
    /**
     * Shorten a URL with optional entity context
     */
    shorten(originalUrl: string, options?: {
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, any>;
    }): Promise<GenerationResult>;
    /**
     * Resolve a short URL back to its original URL and increment click count
     */
    resolve(urlId: string): Promise<ResolutionResult>;
    /**
     * Get analytics for URLs
     */
    analytics(entityType?: string): Promise<AnalyticsData>;
    /**
     * Store URL in database
     */
    private storeUrl;
}
export * from './types';
export * from './utils';
