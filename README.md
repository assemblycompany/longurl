# LongURL - Programmable URL Management Framework

> **Infrastructure-as-code for URLs. Built for developers who need control.**

Entity-driven URL shortening with intelligent caching, detailed error handling, and flexible storage adapters.

## Installation

```bash
npm install longurl-js
```

## Zero-Friction Testing

**Test immediately without any setup or configuration** - LongURL's CLI works instantly:

```bash
# Get help instantly (zero dependencies, zero config)
npx longurl-js --help

# Test URL generation with your own data
npx longurl-js test product laptop-123
npx longurl-js test user john-doe mysite.com
npx longurl-js test campaign black-friday-2024

# See exactly what URLs your app would generate
✅ URL generated successfully!
🔗 Short URL: https://mysite.com/product/X7gT5p
🆔 URL ID: X7gT5p
```

**Zero environment variables, zero database, zero configuration files** - designed for instant testing:

- 🚀 **Instant evaluation** - understand LongURL in seconds, not hours
- 🔧 **Test URL structures** with your actual entity types and IDs  
- 📊 **Demo to stakeholders** with live URL generation
- ⚡ **Rapid prototyping** without infrastructure setup
- 🎯 **Production preview** - see exactly what your URLs will look like

The CLI works perfectly standalone and only connects to your database when you're ready for persistence. This "zero-friction testing" philosophy ensures you can validate LongURL fits your needs before any setup investment.

When ready for production, simply configure Supabase for persistence and collision detection.

## Quick Start

### Zero Configuration (Recommended)

**Step 1: Create Supabase Project & Database**

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and wait for provisioning (2-3 minutes)
3. In your dashboard, go to "SQL Editor" and run this schema:

```sql
CREATE TABLE endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  url_base TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_endpoints_url_slug ON endpoints(url_slug);
CREATE INDEX idx_endpoints_entity ON endpoints(entity_type, entity_id);
```

4. Go to "Settings" → "API" and copy your **Project URL** and **service_role** key

**Step 2: Configure Environment & Use**

```bash
npm install longurl-js dotenv
```

```typescript
// 1. Set environment variables
// .env file:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// 2. Load environment variables (user's responsibility)
import 'dotenv/config'; // Node.js
// or use your framework's env loading (Next.js, Vite, etc.)

// 3. Use LongURL with zero config
import { LongURL } from 'longurl-js';

const longurl = new LongURL(); // Automatically uses env vars
await longurl.initialize();

// Manage URLs with entity context (primary method)
const result = await longurl.manageUrl(
  'product',                    // entity type
  'prod-123',                   // entity ID
  'https://very-long-url.com/path',
  { campaign: 'launch', source: 'email' } // metadata
);

// Note: shorten() still works as an alias for backward compatibility

console.log(result.shortUrl); // https://yourdomain.co/X7gT5p (shortest by default)
console.log(result.urlId);    // X7gT5p
```

Check your Supabase dashboard → "Table Editor" → `endpoints` to see your data!

### Database Migration (Existing Users)

**If you already have a LongURL database, add the QR code column:**

```sql
-- Add QR code column to existing endpoints table
ALTER TABLE endpoints ADD COLUMN qr_code TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'endpoints' AND column_name = 'qr_code';
```

**For new installations, the QR code column is included automatically in the schema above.**

### Direct Configuration

```typescript
import { LongURL } from 'longurl-js';

// No environment variables needed
const longurl = new LongURL({
  supabase: {
    url: 'https://your-project.supabase.co',
    key: 'your-service-role-key',
    options: {
      cache: { enabled: true, ttlMs: 300000 }, // 5 min cache
      schema: 'public'
    }
  },
  baseUrl: 'https://yourdomain.co'
});
```

### URL Structure Options

```typescript
// Option 1: Minimal URLs (default)
const longurl = new LongURL({
  includeEntityInPath: false // or omit entirely (default)
});
// Result: https://yourdomain.co/X7gT5p

// Option 2: Entity-prefixed URLs
const longurl = new LongURL({
  includeEntityInPath: true
});
// Result: https://yourdomain.co/product/X7gT5p

// Option 3: Environment variable override
// Set LONGURL_INCLUDE_ENTITY_IN_PATH=true
const longurl = new LongURL(); // Uses env var
```

## 🆕 Framework Mode: Beyond URL Shortening

**NEW:** LongURL now works as a complete **URL management framework**, not just a shortener. Choose between ultra-short URLs and SEO-friendly readable URLs while keeping all the powerful entity management features.

### Two Modes, One Library

```typescript
// 🔗 SHORTENING MODE (Default - Backward Compatible)
const shortener = new LongURL({ enableShortening: true });
await shortener.manageUrl('product', 'laptop-dell-xps-13', 'https://...');
// Result: https://yourdomain.co/product/X7gT5p
// Perfect for: Social media, SMS, QR codes, character limits

// 📈 FRAMEWORK MODE (New - SEO Friendly)
const urlManager = new LongURL({ enableShortening: false });
await urlManager.manageUrl('product', 'laptop-dell-xps-13', 'https://...');
// Result: https://yourdomain.co/product/laptop-dell-xps-13
// Perfect for: SEO, content management, readable URLs, branded experiences
```

### Environment Control

```bash
# Enable framework mode globally
export LONGURL_SHORTEN=false

# Now all URLs use readable entity IDs by default
const longurl = new LongURL(); // Uses framework mode
```

### Zero-Friction Testing

Test both modes instantly without database setup:

```bash
# Compare both modes
npx longurl test product laptop-dell-xps-13 mystore.co

# Test only framework mode
npx longurl test product laptop-dell-xps-13 mystore.co --framework
```

**Framework mode gives you:**
- ✅ **SEO-friendly URLs** with readable paths
- ✅ **All the same features**: analytics, collision detection, entity management
- ✅ **Backward compatible**: existing code unchanged
- ✅ **Environment configurable**: switch modes without code changes

## 🎯 Pattern URLs: Platform Control

**NEW:** Create branded URLs with platform-controlled public identifiers. Perfect for business context + unique identification.

```typescript
// Pattern-based URL generation with publicId (RECOMMENDED)
const result = await longurl.manageUrl(
  'product', 
  'vintage-lamp-123',
  '/api/products/vintage-table-lamp',
  { category: 'home-decor', brand: 'craftwood' },
  { urlPattern: 'furniture-vintage-table-lamp-{publicId}' }
);

// Result: furniture-vintage-table-lamp-8K9mN2
// ✅ SEO context: furniture-vintage-table-lamp
// ✅ Platform control: 8K9mN2 (Base62 public identifier)  
// ✅ Collision detection: on full generated URL

// Pattern-based URL generation with endpointId (DEPRECATED - still works)
const result = await longurl.manageUrl(
  'product', 
  'vintage-lamp-123',
  '/api/products/vintage-table-lamp',
  { category: 'home-decor', brand: 'craftwood' },
  { urlPattern: 'furniture-vintage-table-lamp-{endpointId}' }
);
```

**Benefits:**
- **Platform ownership** - public identifiers controlled by you, not vendors
- **Better collision resistance** - larger namespace than 6-char shortening
- **Flexible placement** - `{publicId}` works anywhere in pattern
- **Business context** - URLs include semantic meaning

```typescript
// Flexible patterns with publicId (RECOMMENDED)
urlPattern: '{publicId}-vintage-furniture'        // Beginning
urlPattern: 'shop-{publicId}-handmade'           // Middle  
urlPattern: 'artisan-crafted-table-{publicId}'   // End

// Flexible patterns with endpointId (DEPRECATED - still works)
urlPattern: '{endpointId}-vintage-furniture'      // Beginning
urlPattern: 'shop-{endpointId}-handmade'         // Middle  
urlPattern: 'artisan-crafted-table-{endpointId}' // End
```

## 🆕 Public ID Management: `includeInSlug` Option

**NEW:** Control whether your public identifier appears in the URL or is kept separate. Perfect for scenarios where you want to preserve business identifiers while using opaque URLs.

### How It Works

```typescript
// Framework Mode with includeInSlug: true (default)
const result = await longurl.manageUrl(
  'product', 
  'laptop-dell-xps-13',
  'https://shop.com/laptop',
  { category: 'electronics' },
  { 
    enableShortening: false,  // Framework Mode
    includeInSlug: true      // Entity ID in URL (default)
  }
);
// Result: https://yourdomain.co/laptop-dell-xps-13
// publicId: 'laptop-dell-xps-13' (same as urlId)

// Framework Mode with includeInSlug: false
const result = await longurl.manageUrl(
  'product', 
  'laptop-dell-xps-13',
  'https://shop.com/laptop',
  { category: 'electronics' },
  { 
    enableShortening: false,  // Framework Mode
    includeInSlug: false     // Random slug in URL
  }
);
// Result: https://yourdomain.co/X7gT5p
// publicId: 'laptop-dell-xps-13' (preserved separately)
```

### Use Cases

**`includeInSlug: true` (Default) - SEO-Friendly URLs:**
```typescript
// Perfect for: SEO, content management, readable URLs
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  includeInSlug: true
});
// URL: https://yourdomain.co/laptop-dell-xps-13
// publicId: 'laptop-dell-xps-13'
```

**`includeInSlug: false` - Opaque URLs with Preserved Identifiers:**
```typescript
// Perfect for: Privacy, security, tracking without exposing business logic
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  includeInSlug: false
});
// URL: https://yourdomain.co/X7gT5p
// publicId: 'laptop-dell-xps-13' (saved separately in your database)
```

### Database Storage

The `publicId` is always returned in the response, allowing you to store it separately:

```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...', {}, {
  enableShortening: false,
  includeInSlug: false
});

// Save to your database
await db.products.update({
  where: { id: 'laptop-dell-xps-13' },
  data: {
    publicId: result.publicId,        // 'laptop-dell-xps-13'
    urlSlug: result.urlId,           // 'X7gT5p'
    destinationUrl: result.urlBase    // 'https://...'
  }
});
```

### Shortening Mode Behavior

**Note:** `includeInSlug` only applies to **Framework Mode**. In Shortening Mode, the random ID serves as both the URL slug and public identifier:

```typescript
// Shortening Mode (enableShortening: true) - includeInSlug is ignored
const result = await longurl.manageUrl('campaign', 'summer-sale', 'https://...');
// Result: https://yourdomain.co/X7gT5p
// publicId: 'X7gT5p' (same as urlId)
```

### Pattern URLs with `includeInSlug`

```typescript
// Pattern with includeInSlug: true (default)
const result = await longurl.manageUrl('product', 'lamp-123', 'https://...', {}, {
  urlPattern: 'furniture-{publicId}',
  includeInSlug: true
});
// Result: https://yourdomain.co/furniture-X7gT5p
// publicId: 'X7gT5p'

// Pattern with includeInSlug: false
const result = await longurl.manageUrl('product', 'lamp-123', 'https://...', {}, {
  urlPattern: 'furniture-{publicId}',
  includeInSlug: false
});
// Result: https://yourdomain.co/furniture-X7gT5p
// publicId: 'X7gT5p' (preserved, but URL uses random slug)
```

## 🆕 QR Code Generation

**NEW:** Automatic QR code generation for every URL. Perfect for marketing campaigns, business cards, and offline sharing.

### How It Works

QR codes are generated automatically for every URL and returned as base64 data URLs. You can disable QR generation for performance or privacy reasons.

```typescript
// QR codes enabled by default
const result = await longurl.manageUrl(
  'product', 
  'laptop-123',
  'https://shop.com/laptop',
  { category: 'electronics' }
);
// result.qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

// Disable QR code generation
const result = await longurl.manageUrl(
  'product', 
  'laptop-123',
  'https://shop.com/laptop',
  { category: 'electronics' },
  { generate_qr_code: false }
);
// result.qrCode: undefined
```

### Use Cases

**Marketing Campaigns:**
```typescript
const result = await longurl.manageUrl('campaign', 'black-friday-2024', 'https://...');
// Use result.qrCode for:
// - Print materials
// - Business cards
// - Social media posts
// - Event signage
```

**Business Applications:**
```typescript
const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', 'https://...');
// result.qrCode can be:
// - Displayed on product pages
// - Embedded in emails
// - Shared via messaging apps
// - Used in physical marketing materials
```

### QR Code Storage

QR codes are stored in the database as base64 strings and returned in the API response:

```typescript
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');

// QR code is automatically stored in database
// result.qrCode contains the base64 data URL

// Use the QR code immediately
const qrCodeImage = result.qrCode; // "data:image/png;base64,..."

// Or save to your own storage
await saveQRCodeToStorage(result.qrCode, result.urlId);
```

### QR Code Format

- **Format**: PNG image as base64 data URL
- **Size**: ~1.7KB (optimized for storage)
- **Quality**: High contrast, readable at small sizes
- **Error Correction**: Level L (7% recovery)

### Performance Considerations

- **Default**: QR codes generated for every URL
- **Disable**: Set `generate_qr_code: false` for performance
- **Storage**: ~1.7KB per QR code in database
- **Generation**: Asynchronous, non-blocking

### Pattern URLs with QR Codes

```typescript
// Pattern with QR code generation
const result = await longurl.manageUrl('product', 'lamp-123', 'https://...', {}, {
  urlPattern: 'furniture-{publicId}',
  generate_qr_code: true
});
// result.qrCode: "data:image/png;base64,..."
```

### Shortening Mode Behavior

QR codes work in both Shortening Mode and Framework Mode:

```typescript
// Shortening Mode with QR code
const result = await longurl.manageUrl('campaign', 'summer-sale', 'https://...', {}, {
  enableShortening: true,
  generate_qr_code: true
});
// URL: https://yourdomain.co/X7gT5p
// QR Code: Generated for the short URL
```

## Field Naming (Clearer API)

LongURL uses intuitive field names that clearly describe what each field represents:

| Field Purpose | New Name (Recommended) | Legacy Name (Still Supported) |
|---------------|------------------------|--------------------------------|
| Public path segment | `urlSlug` | `urlId` |
| Destination/internal route | `urlBase` | `originalUrl` |
| Complete generated URL | `urlOutput` | `shortUrl` |

### Examples:

```typescript
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');

// NEW: Clear naming (recommended)
console.log(result.urlSlug);   // "X7gT5p" - the public path segment
console.log(result.urlBase);   // "https://..." - where it redirects to  
console.log(result.urlOutput); // "https://yourdomain.co/X7gT5p" - final URL

// LEGACY: Original naming (still works)
console.log(result.urlId);      // Same as urlSlug
console.log(result.originalUrl); // Same as urlBase
console.log(result.shortUrl);   // Same as urlOutput
```

Both naming conventions work simultaneously - use whichever feels clearer for your team.

## Method Evolution: `manageUrl()` as Primary

LongURL has evolved from a simple URL shortener to a comprehensive **URL management framework**. To reflect this evolution, `manageUrl()` is now the primary method:

```typescript
// ✅ PREFERRED: Primary method for URL management
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...');

// ✅ STILL WORKS: Legacy alias for backward compatibility  
const result = await longurl.shorten('product', 'laptop-123', 'https://...');
```

**Why the change?**
- **Clearer semantics**: "manage" better describes the full feature set
- **Framework identity**: LongURL is now a URL management platform, not just a shortener
- **Better DX**: More intuitive for developers building URL-driven applications

**Full backward compatibility**: All existing `shorten()` calls continue to work exactly as before.

## Why LongURL?

### 🔧 **Developer-First Architecture**
- **Zero-friction testing** - try immediately without setup
- **TypeScript-native** with full type safety
- **Adapter pattern** for different storage backends
- **Detailed error handling** with actionable messages
- **Graceful degradation** - works with or without database

### 🏗️ **Entity-Driven Design**
- **Organize URLs by business entities** (products, users, campaigns)
- **Rich metadata support** for analytics and context
- **Flexible schema** - use your existing table structure

### ⚡ **Performance & Reliability**
- **Built-in collision detection** with Base62 encoding (56.8 billion URL combinations)
- **Intelligent caching** with configurable TTL and size limits
- **Batch operations** for high-throughput scenarios
- **Real-time subscriptions** (Supabase)

### 🔗 **Flexible URL Structures**
- **Minimal URLs** (`yourdomain.co/X7gT5p`) - Default behavior
- **Entity-prefixed URLs** (`yourdomain.co/product/X7gT5p`) - Optional alternative
- **Environment-configurable** - Switch modes without code changes

## Architecture Decision: Why Entity-Driven?

Traditional URL shorteners treat URLs as isolated strings. LongURL treats them as **business objects** with context:

```typescript
// Traditional approach: URLs in isolation
shortener.create('https://shop.com/product/123') // → abc123

// LongURL approach: URLs with business context
longurl.shorten('product', 'laptop-pro-2024', 'https://shop.com/product/123', {
  category: 'electronics',
  campaign: 'black-friday'
}) // → X7gT5p with full context
```

**Benefits:**
- **Analytics by entity** - Track performance per product, user, campaign
- **Organized management** - Find all URLs for a specific business object
- **Rich metadata** - Store campaign data, A/B test variants, user context
- **Business intelligence** - Connect URL performance to business metrics

## Database Setup

### Minimal Required Schema

```sql
CREATE TABLE endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  url_base TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Recommended Full Schema

```sql
CREATE TABLE endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  url_base TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Analytics table for detailed click tracking
CREATE TABLE url_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT REFERENCES endpoints(url_slug),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Optional: RPC function for atomic click counting
CREATE OR REPLACE FUNCTION increment_click_count(url_slug_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE endpoints 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE url_slug = url_slug_param;
END;
$$ LANGUAGE plpgsql;
```

### Legacy Schema Support

LongURL automatically detects and supports the legacy `short_urls` table with `url_id`/`original_url` columns for backwards compatibility. Existing installations continue working without changes.

## Core Usage

### Basic Operations

```typescript
import { LongURL } from 'longurl-js';

const longurl = new LongURL(); // Uses environment variables
await longurl.initialize();

// Shorten URLs with entity context
const result = await longurl.shorten(
  'product',                    // entity type
  'prod-123',                   // entity ID
  'https://very-long-url.com/path',
  { campaign: 'launch', source: 'email' } // metadata
);

// Resolve URLs (with automatic click tracking)
const resolved = await longurl.resolve('X7gT5p');
console.log(resolved.originalUrl);  // https://very-long-url.com/path
console.log(resolved.entityType);   // product
console.log(resolved.entityId);     // prod-123
console.log(resolved.metadata);     // { campaign: 'launch', source: 'email' }

// Get detailed analytics
const analytics = await longurl.analytics('X7gT5p');
console.log(analytics.data.totalClicks);    // 42
console.log(analytics.data.lastClickAt);    // 2024-01-15T10:30:00Z
console.log(analytics.data.clickHistory);   // Array of click events
```

### Pattern URLs with Endpoint IDs

LongURL offers an optional pattern system for branded URLs with endpoint ID placeholders:

```typescript
### Pattern URLs with Public Identifiers

LongURL offers an optional pattern system for branded URLs with public identifier placeholders:

```typescript
// Basic URL generation (default)
const result = await longurl.manageUrl('campaign', 'summer-sale', 'https://shop.com/sale');
// Shortener mode: https://yourdomain.co/X7gT5p (random Base62 ID)
// Framework mode: https://yourdomain.co/summer-sale (entity-based slug)

// Pattern URLs with auto-generated public identifiers (RECOMMENDED)
const result = await longurl.manageUrl(
  'campaign', 
  'summer-sale', 
  'https://shop.com/sale',
  { source: 'email' },
  { urlPattern: 'summer-sale-{publicId}' }  // Pattern with placeholder
);
// Result: https://yourdomain.co/summer-sale-X7gT5p (pattern + generated public identifier)

// Pattern URLs with existing public identifiers (reuse your IDs) - RECOMMENDED
const result = await longurl.manageUrl(
  'campaign',
  'summer-sale', 
  'https://shop.com/sale',
  { source: 'email' },
  { 
    urlPattern: 'summer-sale-{publicId}',
    publicId: 'PROMO2024'  // Your existing campaign ID
  }
);
// Result: https://yourdomain.co/summer-sale-PROMO2024

// publicId also works with basic modes (no pattern) - RECOMMENDED
const result = await longurl.manageUrl(
  'campaign', 
  'summer-sale', 
  'https://shop.com/sale',
  { source: 'email' },
  { publicId: 'CAMPAIGN2024' }  // Override random/entity generation
);
// Result: https://yourdomain.co/CAMPAIGN2024 (or /campaign/CAMPAIGN2024)

### Response Format

All URL generation methods return a consistent response format:

```typescript
const result = await longurl.manageUrl('campaign', 'summer-sale', 'https://shop.com/sale', {}, {
  urlPattern: 'summer-sale-{publicId}'
});

console.log(result);
// {
//   success: true,
//   urlId: 'summer-sale-X7gT5p',           // Full generated URL slug
//   urlSlug: 'summer-sale-X7gT5p',         // Same as urlId (new naming)
//   shortUrl: 'https://yourdomain.co/summer-sale-X7gT5p',
//   urlOutput: 'https://yourdomain.co/summer-sale-X7gT5p', // Same as shortUrl (new naming)
//   originalUrl: 'https://shop.com/sale',
//   urlBase: 'https://shop.com/sale',       // Same as originalUrl (new naming)
//   publicId: 'X7gT5p',                     // ← NEW: Just the generated ID!
//   entityType: 'campaign',
//   entityId: 'summer-sale'
// }

// Access the publicId directly (no URL parsing needed!)
const publicId = result.publicId; // 'X7gT5p'
```

**Key benefit**: The `publicId` field gives you direct access to the generated identifier without parsing the URL.

// Pattern URLs with endpointId (DEPRECATED - still works)
const result = await longurl.manageUrl(
  'campaign', 
  'summer-sale', 
  'https://shop.com/sale',
  { source: 'email' },
  { urlPattern: 'summer-sale-{endpointId}' }  // DEPRECATED placeholder
);

// endpointId also works with basic modes (DEPRECATED - still works)
const result = await longurl.manageUrl(
  'campaign', 
  'summer-sale', 
  'https://shop.com/sale',
  { source: 'email' },
  { endpointId: 'CAMPAIGN2024' }  // DEPRECATED parameter
);
```

**Use cases:**
- **Branded campaign URLs** with business context and unique identifiers
- **Reuse existing IDs** across multiple URL patterns for the same campaign  
- **A/B testing** with consistent tracking identifiers
- **Integration** with existing campaign management systems

### Advanced Features

```typescript
// Batch operations
const urls = [
  { urlId: 'abc123', entityType: 'product', entityId: 'prod-1', originalUrl: 'https://...' },
  { urlId: 'def456', entityType: 'product', entityId: 'prod-2', originalUrl: 'https://...' }
];

await adapter.saveBatch(urls);

// Real-time subscriptions (Supabase only)
const subscription = adapter.subscribeToChanges((payload) => {
  console.log('URL event:', payload);
});

// Cache statistics
const stats = adapter.getCacheStats();
console.log(stats); // { size: 150, maxSize: 1000, enabled: true }

// Health checks
const isHealthy = await longurl.healthCheck();
console.log(isHealthy); // true/false
```

## Error Handling

LongURL provides detailed, actionable error messages:

```typescript
try {
  await longurl.shorten('product', 'prod-123', 'https://example.com');
} catch (error) {
  if (error instanceof SupabaseAdapterError) {
    console.log(error.code);        // 'PGRST116'
    console.log(error.message);     // "Table 'short_urls' not found"
    console.log(error.suggestion);  // "Create the table 'short_urls'..."
    console.log(error.sqlHint);     // "CREATE TABLE short_urls (...)"
    console.log(error.docsUrl);     // Link to Supabase docs
  }
}
```

## Use Cases

### E-commerce Product Sharing

```typescript
await longurl.shorten(
  'product', 
  'laptop-pro-2024',
  'https://shop.com/products/laptop-pro-2024?utm_source=email',
  { 
    category: 'electronics', 
    price: 1299,
    campaign: 'black-friday'
  }
);
```

### SaaS Feature Tracking

```typescript
await longurl.shorten(
  'feature',
  'dashboard-analytics',
  'https://app.com/dashboard/analytics',
  { 
    customer: 'acme-corp',
    plan: 'enterprise',
    feature_tier: 'premium'
  }
);
```

### Content Marketing

```typescript
await longurl.shorten(
  'blog-post',
  'how-to-scale-nodejs',
  'https://blog.com/how-to-scale-nodejs',
  { 
    author: 'jane-doe',
    topic: 'performance',
    publish_date: '2024-01-15'
  }
);
```

## Environment Setup

LongURL requires environment variables for Supabase connection. **The library does not load .env files** - this is your application's responsibility.

### Node.js Applications

```typescript
// Option 1: Using dotenv (recommended)
import 'dotenv/config'; // Load before importing LongURL
import { LongURL } from 'longurl-js';

// Option 2: Manual loading
import dotenv from 'dotenv';
dotenv.config();
import { LongURL } from 'longurl-js';
```

### Next.js Applications

Next.js works seamlessly with LongURL's zero-config approach:

```typescript
// .env.local file (automatically loaded by Next.js)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// Optional: Custom table names
LONGURL_TABLE_NAME=my_custom_urls           // Default: 'short_urls'
LONGURL_ANALYTICS_TABLE_NAME=my_analytics   // Default: 'url_analytics'
```

**API Routes (App Router)**:
```typescript
// app/api/shorten/route.ts
import { LongURL } from 'longurl-js';

const longurl = new LongURL(); // Uses Next.js env vars

export async function POST(request: Request) {
  const { entityType, entityId, url, metadata } = await request.json();
  
  const result = await longurl.shorten(entityType, entityId, url, metadata);
  
  return Response.json(result);
}
```

**API Routes (Pages Router)**:
```typescript
// pages/api/shorten.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { LongURL } from 'longurl-js';

const longurl = new LongURL();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { entityType, entityId, url, metadata } = req.body;
  
  const result = await longurl.shorten(entityType, entityId, url, metadata);
  
  res.json(result);
}
```

**Server Components**:
```typescript
// app/dashboard/page.tsx
import { LongURL } from 'longurl-js';

const longurl = new LongURL();

export default async function Dashboard() {
  const analytics = await longurl.analytics('X7gT5p');
  
  return (
    <div>
      <h1>URL Analytics</h1>
      <p>Total clicks: {analytics.data?.totalClicks}</p>
    </div>
  );
}
```

## API Reference

### Core Methods

- `new LongURL(config?)` - Create instance with optional configuration
- `longurl.initialize()` - Initialize the adapter connection
- `longurl.shorten(entityType, entityId, url, metadata?)` - Shorten URL with entity context
- `longurl.manageUrl(entityType, entityId, url, metadata?)` - Manage URL (better naming for framework mode)
- `longurl.resolve(urlId)` - Resolve URL and track click
- `longurl.analytics(urlId)` - Get detailed analytics for a URL
- `longurl.healthCheck()` - Check adapter health
- `longurl.close()` - Close adapter connections

### Adapter Methods (Advanced)

- `adapter.saveBatch(data[])` - Batch save operations
- `adapter.subscribeToChanges(callback)` - Real-time subscriptions (Supabase)
- `adapter.getCacheStats()` - Cache performance metrics

## Changelog

### v0.2.3 (June 2025)

**🎯 New: Custom Table Name Support**

- **Added**: `LONGURL_TABLE_NAME` environment variable to customize the main table name
- **Added**: `LONGURL_ANALYTICS_TABLE_NAME` environment variable to customize the analytics table name
- **Default**: Still uses `short_urls` and `url_analytics` if not specified

This enables flexible database schema management:

```bash
# Use custom table names
export LONGURL_TABLE_NAME=my_url_mappings
export LONGURL_ANALYTICS_TABLE_NAME=my_click_tracking

# Your SQL schema can now use these custom names
CREATE TABLE my_url_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,
  url_base TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE my_click_tracking (...);
```

Perfect for:
- Existing database schemas with naming conventions
- Multi-tenant applications with prefixed table names
- Different environments (dev_urls, staging_urls, prod_urls)

**Note**: LongURL defaults to the modern `endpoints` table but automatically detects and supports legacy `short_urls` tables for backwards compatibility.

### v0.2.2 (June 2025)

**🐛 Fixed: Framework Mode Entity Path Handling**

- **Fixed**: Framework mode now correctly respects the `includeEntityInPath` setting
- **Before**: `manageUrl()` with `includeEntityInPath: false` would still generate `https://store.co/product/laptop-123`
- **After**: Now correctly generates clean URLs like `https://store.co/laptop-123`

This enables truly clean, readable URLs in framework mode:

```typescript
// Now works correctly in v0.2.2!
const longurl = new LongURL({ 
  enableShortening: false, 
  includeEntityInPath: false 
});

const result = await longurl.manageUrl('product', 'laptop-dell-xps-13', url);
// ✅ Result: https://store.co/laptop-dell-xps-13 (clean URL)
// ❌ Before: https://store.co/product/laptop-dell-xps-13 (forced entity prefix)
```

Environment variable support:
```bash
export LONGURL_SHORTEN=false
export LONGURL_INCLUDE_ENTITY_IN_PATH=false
# Now generates clean URLs: store.co/laptop-dell-xps-13
```

## Contributing

We're building developer-first URL infrastructure. Contributions welcome!

- **Issues**: Bug reports and feature requests
- **PRs**: Code improvements and new adapters
- **Docs**: Help improve documentation

## License

MIT - Use it however you want.