# LongURL - Programmable URL Shortener

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

**Zero environment variables, zero database, zero configuration files** - designed like Tesla's supercharger network for instant testing:

- 🚀 **Instant evaluation** - understand LongURL in seconds, not hours
- 🔧 **Test URL structures** with your actual entity types and IDs  
- 📊 **Demo to stakeholders** with live URL generation
- ⚡ **Rapid prototyping** without infrastructure setup
- 🎯 **Production preview** - see exactly what your URLs will look like

The CLI works perfectly standalone and only connects to your database when you're ready for persistence. This "zero-friction testing" philosophy ensures you can validate LongURL fits your needs before any setup investment.

When ready for production, simply configure Supabase for persistence and collision detection.

## Quick Start

### Zero Configuration (Recommended)

```typescript
// 1. Set environment variables
// .env file:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// 2. Load environment variables (user's responsibility)
import 'dotenv/config'; // Node.js
// or use your framework's env loading (Next.js, Vite, etc.)

// 3. Use LongURL with zero config
import { LongURL } from 'longurl-js';

const longurl = new LongURL(); // Automatically uses env vars
await longurl.initialize();

// Shorten URLs with entity context
const result = await longurl.shorten(
  'product',                    // entity type
  'prod-123',                   // entity ID
  'https://very-long-url.com/path',
  { campaign: 'launch', source: 'email' } // metadata
);

console.log(result.shortUrl); // https://yourdomain.co/X7gT5p (shortest by default)
console.log(result.urlId);    // X7gT5p
```

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

## When NOT to Use LongURL

LongURL is designed for **business applications** that need organized URL management. Consider alternatives if you need:

- **Simple URL shortening** without business context (use bit.ly, tinyurl)
- **Anonymous/public shortening** without user accounts (use traditional shorteners)
- **Extreme scale** (billions of URLs) without entity organization (build custom solution)
- **Zero infrastructure** requirements (use hosted services)

LongURL shines when you need **programmatic control** and **business context** for your URLs.

## Database Setup

### Minimal Required Schema

```sql
CREATE TABLE short_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Recommended Full Schema

```sql
CREATE TABLE short_urls (
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

-- Optional: Analytics table for detailed click tracking
CREATE TABLE url_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url_id TEXT REFERENCES short_urls(url_id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Optional: RPC function for atomic click counting
CREATE OR REPLACE FUNCTION increment_click_count(url_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE short_urls 
  SET click_count = click_count + 1, updated_at = NOW()
  WHERE url_id = url_id_param;
END;
$$ LANGUAGE plpgsql;
```

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
- `longurl.resolve(urlId)` - Resolve URL and track click
- `longurl.analytics(urlId)` - Get detailed analytics for a URL
- `longurl.healthCheck()` - Check adapter health
- `longurl.close()` - Close adapter connections

### Adapter Methods (Advanced)

- `adapter.saveBatch(data[])` - Batch save operations
- `adapter.subscribeToChanges(callback)` - Real-time subscriptions (Supabase)
- `adapter.getCacheStats()` - Cache performance metrics

## Contributing

We're building developer-first URL infrastructure. Contributions welcome!

- **Issues**: Bug reports and feature requests
- **PRs**: Code improvements and new adapters
- **Docs**: Help improve documentation

## License

MIT - Use it however you want.