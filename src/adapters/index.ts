/**
 * Storage Adapters
 * 
 * This module provides the adapter pattern for different storage backends.
 */

export { StorageAdapter } from './StorageAdapter.js';
export { SupabaseAdapter } from './SupabaseAdapter.js';

// Re-export types
export type { 
  EntityData, 
  AnalyticsData, 
  AdapterConfig,
  SupabaseConfig 
} from './types.js'; 