/**
 * Storage Adapters
 * 
 * This module provides the adapter pattern for different storage backends.
 */

// Export core storage abstractions
export { StorageAdapter } from '../core/storage/index.js';
export type { EntityData, AnalyticsData, AdapterConfig } from '../core/storage/index.js';

// Export specific adapter implementations
export { SupabaseAdapter } from './supabase/index.js';
export type { SupabaseConfig } from './supabase/index.js'; 