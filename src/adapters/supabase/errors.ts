/**
 * Supabase Error Handler
 * 
 * Provides detailed, actionable error messages for common Supabase/PostgreSQL errors.
 * Helps developers debug schema issues, connection problems, and data constraints.
 */

export interface SupabaseErrorDetails {
  code: string;
  message: string;
  suggestion: string;
  sqlHint?: string;
  docsUrl?: string;
}

/**
 * Enhanced error class with detailed context
 */
export class SupabaseAdapterError extends Error {
  public readonly code: string;
  public readonly suggestion: string;
  public readonly sqlHint?: string;
  public readonly docsUrl?: string;
  public readonly originalError: any;

  constructor(details: SupabaseErrorDetails, originalError?: any) {
    super(details.message);
    this.name = 'SupabaseAdapterError';
    this.code = details.code;
    this.suggestion = details.suggestion;
    this.sqlHint = details.sqlHint;
    this.docsUrl = details.docsUrl;
    this.originalError = originalError;
  }
}

/**
 * Parse and enhance Supabase errors with actionable context
 */
export function parseSupabaseError(error: any, operation: string, tableName: string = 'short_urls'): SupabaseAdapterError {
  const code = error?.code || 'UNKNOWN';
  const message = error?.message || 'Unknown error';
  
  // Common PostgreSQL/Supabase error codes
  switch (code) {
    case 'PGRST116':
      return new SupabaseAdapterError({
        code,
        message: `Table '${tableName}' not found`,
        suggestion: `Create the table '${tableName}' in your Supabase database. You can use any schema structure as long as it has the required columns.`,
        sqlHint: `
CREATE TABLE ${tableName} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
        docsUrl: 'https://supabase.com/docs/guides/database/tables'
      }, error);

    case 'PGRST301':
      return new SupabaseAdapterError({
        code,
        message: `Connection timeout during ${operation}`,
        suggestion: 'Check your network connection and Supabase service status. Consider increasing timeout or retry settings.',
        docsUrl: 'https://supabase.com/docs/guides/platform/performance'
      }, error);

    case 'PGRST302':
      return new SupabaseAdapterError({
        code,
        message: `Connection failed during ${operation}`,
        suggestion: 'Verify your Supabase URL and API key. Check if your project is paused or has connection limits.',
        docsUrl: 'https://supabase.com/docs/guides/platform/logs'
      }, error);

    case '23505':
      const constraint = error?.details?.includes('url_id') ? 'url_id' : 'unknown';
      return new SupabaseAdapterError({
        code,
        message: `Duplicate ${constraint} constraint violation`,
        suggestion: `A URL with this ID already exists. This usually indicates a collision in URL generation. Check your collision detection logic.`,
        sqlHint: `SELECT * FROM ${tableName} WHERE url_id = 'your_url_id';`
      }, error);

    case '23502':
      const column = extractColumnFromError(message);
      return new SupabaseAdapterError({
        code,
        message: `Required column '${column}' is missing`,
        suggestion: `Ensure your table schema includes the '${column}' column with NOT NULL constraint, or modify your data to include this field.`,
        sqlHint: `ALTER TABLE ${tableName} ADD COLUMN ${column} TEXT NOT NULL;`
      }, error);

    case '42703':
      const missingColumn = extractColumnFromError(message);
      return new SupabaseAdapterError({
        code,
        message: `Column '${missingColumn}' does not exist`,
        suggestion: `Add the missing column to your table schema, or check if you're using the correct column names.`,
        sqlHint: `ALTER TABLE ${tableName} ADD COLUMN ${missingColumn} TEXT;`
      }, error);

    case '42P01':
      return new SupabaseAdapterError({
        code,
        message: `Table '${tableName}' does not exist`,
        suggestion: `Create the table in your Supabase database. You can customize the schema to fit your needs.`,
        sqlHint: `CREATE TABLE ${tableName} (...);`,
        docsUrl: 'https://supabase.com/docs/guides/database/tables'
      }, error);

    case 'PGRST204':
      return new SupabaseAdapterError({
        code,
        message: `No rows found during ${operation}`,
        suggestion: 'This might be expected behavior (URL not found), or indicate a data consistency issue.',
      }, error);

    case '42501':
      return new SupabaseAdapterError({
        code,
        message: `Permission denied for ${operation}`,
        suggestion: 'Check your RLS (Row Level Security) policies and ensure your API key has the required permissions.',
        docsUrl: 'https://supabase.com/docs/guides/auth/row-level-security'
      }, error);

    case 'PGRST103':
      return new SupabaseAdapterError({
        code,
        message: `Invalid API key or authentication failed`,
        suggestion: 'Verify your Supabase API key is correct and has not expired. Use the service role key for server-side operations.',
        docsUrl: 'https://supabase.com/docs/guides/api/api-keys'
      }, error);

    default:
      return new SupabaseAdapterError({
        code: code || 'UNKNOWN',
        message: `${operation} failed: ${message}`,
        suggestion: 'Check the error details and Supabase logs for more information. This might be a network issue or unexpected database constraint.',
        docsUrl: 'https://supabase.com/docs/guides/platform/logs'
      }, error);
  }
}

/**
 * Extract column name from PostgreSQL error messages
 */
function extractColumnFromError(message: string): string {
  // Try to extract column name from common error patterns
  const patterns = [
    /column "([^"]+)"/i,
    /null value in column "([^"]+)"/i,
    /"([^"]+)" violates/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }

  return 'unknown_column';
}

/**
 * Log detailed error information for debugging
 */
export function logSupabaseError(error: SupabaseAdapterError, context?: Record<string, any>): void {
  console.error('🔥 Supabase Adapter Error:', {
    code: error.code,
    message: error.message,
    suggestion: error.suggestion,
    sqlHint: error.sqlHint,
    docsUrl: error.docsUrl,
    context,
    originalError: error.originalError
  });
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = new Set([
    'PGRST301', // Connection timeout
    'PGRST302', // Connection failed
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT'
  ]);

  return retryableCodes.has(error?.code);
}

/**
 * Generate helpful schema suggestions based on operation
 */
export function getSchemaHelp(tableName: string = 'short_urls'): string {
  return `
-- Minimal required schema for LongURL:
CREATE TABLE ${tableName} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommended full schema:
CREATE TABLE ${tableName} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional analytics table:
CREATE TABLE url_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT REFERENCES ${tableName}(url_id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
`;
} 