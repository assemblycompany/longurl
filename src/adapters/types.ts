/**
 * Types for Storage Adapters
 */

export interface EntityData {
  urlId: string;
  entityType: string;
  entityId: string;
  originalUrl: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  urlId: string;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
  lastClickAt?: string;
  clickHistory?: ClickEvent[];
}

export interface ClickEvent {
  timestamp: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  country?: string;
}

export interface AdapterConfig {
  // Base config that all adapters can extend
  [key: string]: any;
}

export interface SupabaseConfig extends AdapterConfig {
  url: string;
  key: string;
  options?: {
    schema?: string;
    headers?: Record<string, string>;
    realtime?: boolean;
  };
} 