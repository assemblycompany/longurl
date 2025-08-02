# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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