/**
 * LongURL - Programmable URL Shortener
 *
 * Infrastructure-as-code for URLs. Built for developers who need control.
 *
 * Main entry point for the longurl package.
 * Exports the LongURL class with built-in Supabase support.
 */
export { LongURL } from './src';
export type { LongURLConfig, EntityConfig, GenerationResult, ResolutionResult, AnalyticsData, DatabaseConfig, StorageStrategy } from './types';
export type { EntityData, AnalyticsData as AdapterAnalyticsData, AdapterConfig } from './src/core/storage/types';
export { generateBase62Id, isValidUrlId } from './utils';
export { StorageAdapter } from './src/core/storage/StorageAdapter';
export { SupabaseAdapter, SupabaseAdapterError, parseSupabaseError, logSupabaseError, isTemporaryError, getSchemaHelp } from './src/adapters/supabase';
export type { SupabaseConfig, SupabaseErrorDetails } from './src/adapters/supabase';
