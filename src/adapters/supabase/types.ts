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
    cache?: {
      enabled?: boolean;
      ttlMs?: number;
      maxSize?: number;
    };
    storage?: {
      /** Store QR code base64 in endpoints table (default: false = use bucket) */
      storeQRInTable?: boolean;
      /** Bucket name for QR code storage (default: 'qr-codes') */
      qrCodeBucket?: string;
    };
  };
} 