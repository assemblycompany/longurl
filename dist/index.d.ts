/**
 * LongURL - Programmable URL Shortener
 *
 * Main entry point for the longurl package.
 * Exports the LongURL class and all related types and adapters.
 */
export { LongURL, StorageAdapter, SupabaseAdapter } from './src';
export type { LongURLConfig, EntityConfig, GenerationResult, ResolutionResult, AnalyticsData, DatabaseConfig, StorageStrategy } from './types';
export type { EntityData, AnalyticsData as AdapterAnalyticsData, AdapterConfig, SupabaseConfig } from './src/adapters/types';
export { generateBase62Id, isValidUrlId } from './utils';
