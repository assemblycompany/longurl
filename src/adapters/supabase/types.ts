/**
 * Supabase Adapter Types
 */

export interface SupabaseConfig {
  url: string;
  key: string;
  options?: {
    schema?: string;
    headers?: Record<string, string>;
    realTime?: {
      enabled: boolean;
      params?: Record<string, any>;
    };
  };
} 