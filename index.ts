/**
 * LongURL - Programmable URL Shortener
 * 
 * Infrastructure-as-code for URLs. Built for developers who need control.
 * 
 * Main entry point for the longurl package.
 * Exports the LongURL class with built-in Supabase support.
 */

// Main export - most users only need this
export { LongURL } from './src';

// Export all types for TypeScript users
export type { 
  LongURLConfig, 
  EntityConfig, 
  GenerationResult, 
  ResolutionResult, 
  AnalyticsData,
  DatabaseConfig,
  StorageStrategy
} from './types';

// Export core storage types for advanced users
export type { 
  EntityData, 
  AnalyticsData as AdapterAnalyticsData, 
  AdapterConfig
} from './src/core/storage/types';

// Export utilities for advanced usage
export { generateBase62Id, isValidUrlId } from './utils';

// Advanced exports (for custom adapters and error handling)
// Most users won't need these
export { StorageAdapter } from './src/core/storage/StorageAdapter';
export { 
  SupabaseAdapter,
  SupabaseAdapterError, 
  parseSupabaseError, 
  logSupabaseError, 
  isTemporaryError,
  getSchemaHelp 
} from './src/adapters/supabase';
export type { SupabaseConfig, SupabaseErrorDetails } from './src/adapters/supabase'; 