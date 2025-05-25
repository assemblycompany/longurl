/**
 * Supabase Adapter Module
 */

export { SupabaseAdapter } from './SupabaseAdapter.js';
export type { SupabaseConfig } from './types.js';

// Export error handling utilities for advanced users
export { 
  SupabaseAdapterError, 
  parseSupabaseError, 
  logSupabaseError, 
  isRetryableError,
  getSchemaHelp 
} from './errors.js';
export type { SupabaseErrorDetails } from './errors.js'; 