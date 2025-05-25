/**
 * LongURL - Programmable URL Shortener
 * 
 * Main entry point for the longurl package.
 * Exports the LongURL class and all related types and adapters.
 */

// Export the main LongURL class and adapters
export { LongURL, StorageAdapter, SupabaseAdapter } from './src';

// Export all types
export type { 
  LongURLConfig, 
  EntityConfig, 
  GenerationResult, 
  ResolutionResult, 
  AnalyticsData,
  DatabaseConfig,
  StorageStrategy
} from './types';

// Export adapter types
export type { 
  EntityData, 
  AnalyticsData as AdapterAnalyticsData, 
  AdapterConfig,
  SupabaseConfig 
} from './src/adapters/types';

// Export utilities for advanced usage
export { generateBase62Id, isValidUrlId } from './utils'; 