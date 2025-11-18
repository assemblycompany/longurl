# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-11-10

### Added
- **NEW**: QR code bucket storage (default behavior)
  - QR codes now uploaded to Supabase Storage bucket by default
  - Stores QR code URL in `qr_code_url` column instead of base64 in `qr_code`
  - Default bucket: `qr-codes` (configurable via `options.storage.qrCodeBucket`)
  - More efficient: No base64 bloat in database, faster queries
  - Better performance: CDN-delivered QR codes from storage bucket
- **NEW**: Optional table storage for QR codes
  - Set `options.storage.storeQRInTable: true` to store base64 in `qr_code` column (old behavior)
  - Allows opt-in to legacy base64 storage if needed
  - Default: `false` (uses bucket storage)

### Changed
- **ENHANCED**: QR code storage architecture
  - **Default**: Upload QR codes to Supabase Storage bucket (`qr-codes`)
  - **Optional**: Store base64 in `qr_code` column (opt-in via config)
  - Response includes `qrCodeUrl` (bucket URL) by default
  - Response includes `qrCode` (base64) only if `storeQRInTable: true`
- **IMPROVED**: `SupabaseAdapter.save()` now handles QR code upload
  - Automatically uploads QR codes to configured bucket
  - Stores public URL in `qr_code_url` column
  - Handles upload errors gracefully (throws clear error messages)
  - Updates cache with `qrCodeUrl` after successful upload

### Configuration
```typescript
// Default: Bucket storage (new, efficient)
const longurl = new LongURL({
  supabase: {
    url: '...',
    key: '...',
    options: {
      storage: {
        qrCodeBucket: 'qr-codes'  // Optional: default is 'qr-codes'
      }
    }
  }
});
// QR codes uploaded to bucket, URL stored in qr_code_url

// Optional: Table storage (old behavior, opt-in)
const longurl = new LongURL({
  supabase: {
    url: '...',
    key: '...',
    options: {
      storage: {
        storeQRInTable: true  // Opt-in to base64 storage
      }
    }
  }
});
// QR codes stored as base64 in qr_code column
```

### Database
- **REQUIRED**: Database must have `qr_code_url` column (already added in your Supabase setup)
- No migration needed if column already exists
- `qr_code` column still supported for backward compatibility (when `storeQRInTable: true`)

### Examples

#### Default bucket storage
```typescript
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');
// result.qrCodeUrl = "https://...supabase.co/storage/v1/object/public/qr-codes/X7gT5p.png"
// result.qrCode = undefined
```

#### Opt-in table storage
```typescript
const longurl = new LongURL({
  supabase: {
    url: '...',
    key: '...',
    options: {
      storage: { storeQRInTable: true }
    }
  }
});
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');
// result.qrCode = "data:image/png;base64,..."
// result.qrCodeUrl = undefined
```

## [0.5.0] - 2025-11-10

### Added
- **NEW**: Update/Upsert functionality for existing endpoints
  - `manageUrl()` now supports updating existing endpoints by entity
  - Automatic upsert: INSERT if new, UPDATE if entity exists
  - Entity-based lookup: Updates by `entity_type + entity_id` (not just slug)
  - Metadata merging: Preserves existing metadata, adds new fields
  - Slug change support: Can update `url_slug` when URL pattern changes
  - Collision protection: Prevents duplicate slugs across entities

### Changed
- **ENHANCED**: `SupabaseAdapter.save()` now implements upsert logic
  - Checks if entity exists before insert
  - Updates existing rows instead of failing on duplicates
  - Preserves `created_at` timestamp on updates
  - Updates `updated_at` timestamp automatically
  - Merges metadata instead of replacing
- **IMPROVED**: Error messages for collision detection
  - Clear messages when slug collisions occur
  - Suggests using update() or different entity_id
  - Distinguishes between update conflicts and create conflicts

### Behavior
- **Idempotent**: Calling `manageUrl()` multiple times with same entity produces same result
- **Safe**: Collision checks prevent data loss
- **Efficient**: Single query to check existence, then insert or update
- **Cache-aware**: Clears old cache entries when slugs change

### Examples

#### Update existing endpoint
```typescript
// First call - creates endpoint
await longurl.manageUrl('product', 'laptop-123', 'https://shop.com/laptop');

// Second call - updates endpoint (same entity)
await longurl.manageUrl('product', 'laptop-123', 'https://shop.com/laptop-v2');
// ✅ Updates url_base, merges metadata, preserves created_at
```

#### Update with new URL pattern
```typescript
// Change URL pattern for existing entity
await longurl.manageUrl('product', 'laptop-123', 'https://shop.com/laptop', {}, {
  urlPattern: 'new-pattern-{publicId}'
});
// ✅ Updates url_slug, invalidates old slug, preserves entity data
```

#### Metadata merging
```typescript
// First call
await longurl.manageUrl('product', 'laptop-123', 'https://...', { 
  campaign: 'launch', 
  source: 'email' 
});

// Update call
await longurl.manageUrl('product', 'laptop-123', 'https://...', { 
  version: '2.0',
  updated: true 
});
// ✅ Final metadata: { campaign: 'launch', source: 'email', version: '2.0', updated: true }
```

## [0.4.0] - 2025-11-10

### Added
- **NEW**: `url_slug_short` database column for efficient storage
  - `url_slug_short` now stored as a column in the same row as `url_slug`
  - Eliminates duplicate rows - both slugs stored together
  - Added `migration-add-url-slug-short.sql` for easy database updates
  - Unique index on `url_slug_short` for fast lookups

### Changed
- **IMPROVED**: Storage architecture for `url_slug_short`
  - Previously: `url_slug_short` stored as separate row
  - Now: Both `url_slug` and `url_slug_short` in same row
  - More efficient: Single row lookup for both URLs
  - Better data integrity: Both slugs always point to same `url_base`
- **ENHANCED**: Resolver now handles both slug types
  - Resolves by `url_slug` (readable slug)
  - Resolves by `url_slug_short` (short Base62 ID)
  - Both resolve to the same `url_base` destination
  - Automatic fallback: tries `url_slug` first, then `url_slug_short`
- **ENHANCED**: Collision detection checks both columns
  - Prevents collisions in both `url_slug` and `url_slug_short`
  - Ensures uniqueness across both slug types
  - Works with legacy and new schema detection

### Migration
- **REQUIRED**: Run `migration-add-url-slug-short.sql` to add column
  - Adds `url_slug_short TEXT UNIQUE` column to `endpoints` table
  - Creates index for fast lookups
  - Backward compatible: Existing URLs work without migration
  - New URLs will populate `url_slug_short` automatically

### Examples

#### Framework Mode with url_slug_short in same row
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false
});
// url_slug: 'laptop-dell-xps-13' (readable)
// url_slug_short: 'X7gT5p' (short for sharing)
// Both stored in same database row
// Both resolve to same url_base
```

#### Resolving by either slug
```typescript
// Both of these resolve to the same destination:
await longurl.resolve('laptop-dell-xps-13');  // url_slug
await longurl.resolve('X7gT5p');              // url_slug_short
```

## [0.3.8] - 2025-07-29

### Added
- **NEW**: `url_slug_short` field for built-in short URLs in Framework Mode
  - Framework Mode now automatically generates both readable and short URLs
  - `url_slug_short` provides short random IDs for easy sharing (social media, SMS, etc.)
  - Both URLs redirect to the same `url_base` destination
  - Stored in database for proper routing and analytics
  - Maintains naming convention with `url_slug` prefix

### Changed
- **ENHANCED**: Framework Mode now includes built-in Shortening Mode functionality
  - Framework Mode = SEO-friendly URLs + built-in short URLs
  - `publicId` preserves business context (entity identifiers, campaign names)
  - `url_slug_short` provides consistent short format for sharing
  - Both URLs get full analytics and tracking
  - Perfect for scenarios requiring both SEO and sharing optimization

### Examples

#### Framework Mode with built-in short URL
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false
});
// URL: https://yourdomain.co/laptop-dell-xps-13 (readable, SEO-friendly)
// publicId: 'laptop-dell-xps-13' (business identifier)
// url_slug_short: '5jGX9H' (short for sharing)
// Both redirect to same destination
```

#### Pattern URLs with built-in short URL
```typescript
const result = await longurl.manageUrl('product', 'laptop-123', '/hub/earthfare-organic-bananas-{publicId}', {}, {
  urlPattern: 'earthfare-organic-bananas-{publicId}',
  includeInSlug: false
});
// URL: https://yourdomain.co/earthfare-organic-bananas (clean)
// publicId: 'yC66VW' (pattern identifier)
// url_slug_short: 'fjetMj' (short for sharing)
// Both redirect to same destination
```

## [0.3.7] - 2025-07-29

### Fixed
- **FIXED**: `includeInSlug: false` now works correctly with pattern URLs
  - Pattern URLs now properly respect `includeInSlug: false` setting
  - Removes trailing dash + placeholder as a unit for clean URLs
  - Preserves publicId for storage while creating clean URL slugs
  - Works consistently across all code paths (collision checking, error handling)
- **FIXED**: Pattern resolution in `url_base` storage
  - `{publicId}` placeholders now properly resolved before database storage
  - Prevents orphaned URLs with unresolved placeholders
  - Ensures all stored `url_base` values are fully resolved
- **FIXED**: Parameter passing to pattern generator
  - `includeInSlug` parameter now correctly passed to pattern generator
  - `generate_qr_code` parameter now correctly passed to pattern generator
  - All options properly reach the pattern generation logic

### Changed
- **IMPROVED**: Pattern URL behavior with `includeInSlug: false`
  - Clean URLs without trailing dashes when `includeInSlug: false`
  - Elegant removal of trailing dash + placeholder as a unit
  - User-friendly pattern design (no special rules needed)
  - Consistent behavior across all URL generation modes

### Examples

#### Pattern URLs with `includeInSlug: false`
```typescript
const result = await longurl.manageUrl('product', 'laptop-123', '/hub/earthfare-organic-bananas-{publicId}', {}, {
  urlPattern: 'earthfare-organic-bananas-{publicId}',
  includeInSlug: false
});
// URL: https://yourdomain.co/earthfare-organic-bananas (clean, no trailing dash)
// publicId: 'X7gT5p' (preserved for storage)
// urlBase: /hub/earthfare-organic-bananas-X7gT5p (resolved for routing)
```

## [0.3.6] - 2025-07-29

### Added
- **NEW**: QR code generation for all URLs
  - Automatic QR code generation for every URL created
  - QR codes returned as base64 data URLs in API response
  - Stored in database as `qr_code` column (nullable)
  - Optimized for storage (~1.7KB per QR code)
  - Can be disabled with `generate_qr_code: false` option
- **NEW**: QR code support in all URL generation modes
  - Works in Shortening Mode and Framework Mode
  - Works with pattern URLs and custom public IDs
  - Graceful error handling if QR generation fails
- **NEW**: QR code utilities and validation
  - `generateOptimizedQRCode()` function for efficient QR generation
  - `isValidQRCodeDataUrl()` function for validation
  - Configurable QR code options (size, error correction, colors)

### Changed
- **UPDATED**: Database schema to include QR code storage
  - Added `qr_code` column to `endpoints` table
  - QR codes stored as base64 strings for immediate use
  - Backward compatible with existing installations
- **ENHANCED**: API response to include QR codes
  - `GenerationResult` now includes `qrCode` field
  - QR codes available immediately in response
  - No additional API calls needed for QR code access

### Performance
- **OPTIMIZED**: QR code generation for production use
  - Asynchronous generation to avoid blocking
  - Error handling prevents QR failures from breaking URL generation
  - Configurable to disable for performance-critical applications

### Examples

#### Basic QR Code Generation
```typescript
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');
// result.qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
```

#### Disable QR Code Generation
```typescript
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  generate_qr_code: false
});
// result.qrCode: undefined
```

#### Framework Mode with QR Code
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  generate_qr_code: true
});
// URL: https://yourdomain.co/laptop-dell-xps-13
// QR Code: Generated for the readable URL
```

## [0.3.5] - 2025-07-29

### Added
- **NEW**: `includeInSlug` parameter for public ID management
  - Added `includeInSlug` option to control whether public IDs appear in URLs
  - Works in Framework Mode to separate entity identifiers from URL slugs
  - Allows opaque URLs while preserving business identifiers
  - Defaults to `true` for backward compatibility
- **NEW**: Enhanced public ID handling in Framework Mode
  - `publicId` field always returns the meaningful entity identifier
  - `urlId` can be random slug when `includeInSlug: false`
  - Perfect for privacy/security scenarios without losing business context

### Changed
- **IMPROVED**: Framework Mode behavior with `includeInSlug` option
  - When `includeInSlug: true` (default): Entity ID appears in URL
  - When `includeInSlug: false`: Random slug in URL, entity ID preserved in `publicId`
  - Shortening Mode ignores `includeInSlug` parameter (as intended)
- **CLARIFIED**: Distinction between Shortening Mode and Framework Mode
  - Shortening Mode: Random ID serves as both URL slug and public identifier
  - Framework Mode: Entity ID can be separated from URL slug via `includeInSlug`

### Examples

#### Framework Mode with `includeInSlug: true` (Default)
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  includeInSlug: true
});
// Result: https://yourdomain.co/laptop-dell-xps-13
// publicId: 'laptop-dell-xps-13' (same as urlId)
```

#### Framework Mode with `includeInSlug: false`
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  includeInSlug: false
});
// Result: https://yourdomain.co/X7gT5p
// publicId: 'laptop-dell-xps-13' (preserved separately)
```

#### Shortening Mode (ignores `includeInSlug`)
```typescript
const result = await longurl.manageUrl('campaign', 'summer-sale', 'https://...');
// Result: https://yourdomain.co/X7gT5p
// publicId: 'X7gT5p' (same as urlId)
```

## [0.3.3] - 2025-07-29

### Added
- **NEW**: `publicId` parameter for clearer naming in URL generation
  - Added `publicId` parameter to `manageUrl()` and `shorten()` methods
  - Added `publicId` parameter to `generateUrlId()` and `generatePatternUrl()` functions
  - Added `{publicId}` placeholder support in URL patterns
  - Created `UrlGenerationOptions` interface for better type safety
- **NEW**: `publicId` field in response objects
  - `GenerationResult` now includes `publicId` field for direct access
  - Eliminates need to parse URLs to extract generated public IDs
  - Works for both developer-provided and auto-generated public IDs

### Changed
- **IMPROVED**: Clearer distinction between public URL identifiers and database columns
  - `publicId` = 6-char string for URLs (what users see)
  - `endpoint_id` = UUID database primary key (internal)
  - Eliminates confusion between parameter and database column names
- **FIXED**: Deprecated field warnings in `enhanceGenerationResult()`
  - Now properly uses new field names (`urlSlug`, `urlBase`, `urlOutput`)
  - Maintains backward compatibility with deprecated fields

### Deprecated
- **DEPRECATED**: `endpointId` parameter (will be removed in future major version)
  - `endpointId` parameter still works for backward compatibility
  - `{endpointId}` placeholder still works for backward compatibility
  - Developers encouraged to migrate to `publicId` for clearer naming

### Backward Compatibility
- **FULLY COMPATIBLE**: All existing code continues to work unchanged
- Both `publicId` and `endpointId` parameters work simultaneously
- Both `{publicId}` and `{endpointId}` placeholders work simultaneously
- Internal logic prioritizes `publicId` over `endpointId` when both provided
- No breaking changes for existing implementations

### Documentation
- **ADDED**: Comprehensive `DEPRECATION-NOTICE.md` with migration guide
- **UPDATED**: README.md with new `publicId` examples and usage patterns
- **ADDED**: Test files demonstrating both old and new functionality
- **UPDATED**: TypeScript types for better developer experience

### Examples

#### New Recommended Usage
```typescript
// ✅ RECOMMENDED: Use publicId for clearer naming
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  publicId: 'LAPTOP2024'
});

// ✅ RECOMMENDED: Use {publicId} in patterns
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  urlPattern: 'furniture-vintage-table-lamp-{publicId}'
});
```

#### Backward Compatible Usage
```typescript
// ✅ STILL WORKS: endpointId continues to work
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  endpointId: 'LAPTOP2024'
});

// ✅ STILL WORKS: {endpointId} in patterns continues to work
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  urlPattern: 'furniture-vintage-table-lamp-{endpointId}'
});
```

### Migration Timeline
- **Version 0.3.1 (Current)**: `publicId` added, `endpointId` still supported
- **Future Version**: `endpointId` deprecated with warnings
- **Future Major Version**: `endpointId` removed

## [0.3.0] - 2024-12-18

### Added
- Framework mode for SEO-friendly URL management
- Pattern URL generation with placeholders
- Entity-driven URL organization
- Supabase adapter with backward compatibility
- Comprehensive TypeScript support

### Changed
- Renamed primary table from `short_urls` to `endpoints`
- Updated column names for clearer semantics:
  - `url_id` → `url_slug`
  - `original_url` → `url_base`
- Enhanced field naming with both new and legacy support

### Deprecated
- `shorten()` method (use `manageUrl()` instead)
- Legacy field names (use `urlSlug`, `urlBase`, `urlOutput`)

## [0.2.0] - 2024-12-17

### Added
- Basic URL shortening functionality
- Supabase integration
- Collision detection
- Analytics tracking

## [0.1.0] - 2024-12-16

### Added
- Initial release
- Core URL shortening capabilities
- Basic TypeScript support 