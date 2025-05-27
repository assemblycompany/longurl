# LongURL - Programmable URL Shortener

> **Infrastructure-as-code for URLs. Built for developers who need control.**

Entity-driven URL shortening with production-ready error handling, intelligent caching, and flexible storage adapters.

## Installation

```bash
npm install longurl
```

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
import { LongURL } from 'longurl';

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
import { LongURL } from 'longurl';

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

### Advanced Configuration

```typescript
import { LongURL, SupabaseAdapter } from 'longurl';

// Custom adapter with full control
const adapter = new SupabaseAdapter({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  options: {
    cache: { enabled: true, ttlMs: 300000 },
    schema: 'public'
  }
});

const longurl = new LongURL({
  adapter,
  baseUrl: 'https://yourdomain.co',
  includeEntityInPath: false, // Default: shortest URLs
  entities: {
    product: { tableName: 'products', primaryKey: 'id' },
    user: { tableName: 'users', primaryKey: 'user_id' }
  }
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

**Key Differences:**

- **Option 2**: Configuration hardcoded in application code - fixed at compile/deploy time
- **Option 3**: Configuration via environment variable - can be changed per environment (dev/staging/prod) without code changes

Both achieve the same result (`yourdomain.co/product/X7gT5p`), but Option 3 provides operational flexibility to switch URL structures via deployment configuration rather than code modification.

- **Entity-prefixed URLs**: SEO-focused sites, organized link management, branded experiences

## Why LongURL?

### 🔧 **Developer-First Architecture**
- **TypeScript-native** with full type safety
- **Adapter pattern** for different storage backends
- **Production-ready error handling** with actionable messages
- **No retry logic** - integrates with your existing infrastructure

### 🏗️ **Entity-Driven Design**
- **Organize URLs by business entities** (products, users, campaigns)
- **Rich metadata support** for analytics and context
- **Flexible schema** - use your existing table structure

### 🔒 **Production-Ready**
- **Intelligent caching** with configurable TTL and size limits
- **Detailed error messages** with SQL hints and documentation links
- **Schema flexibility** - no forced table structure
- **Self-hosted** - your data, your control

### ⚡ **Performance & Reliability**
- **Built-in collision detection** with Base62 encoding
- **Batch operations** for high-throughput scenarios
- **Health checks** and monitoring support
- **Real-time subscriptions** (Supabase)

### 🔗 **Flexible URL Structures**
- **Minimal URLs** (`yourdomain.co/X7gT5p`) - Default behavior
- **Entity-prefixed URLs** (`yourdomain.co/product/X7gT5p`) - Optional alternative
- **Environment-configurable** - Switch modes without code changes

## Configuration Options

### Adapter Configuration

```typescript
// Supabase Adapter with full options
const adapter = new SupabaseAdapter({
  url: 'https://your-project.supabase.co',
  key: 'your-service-role-key',
  options: {
    schema: 'public',                    // Database schema
    headers: { 'x-custom': 'header' },   // Custom headers
    cache: {
      enabled: true,                     // Enable caching
      ttlMs: 300000,                     // 5 minutes
      maxSize: 1000                      // Max cached items
    },
    realTime: {
      enabled: true,                     // Enable real-time subscriptions
      params: { /* subscription params */ }
    }
  }
});
```

### Entity Configuration

```typescript
const longurl = new LongURL({
  adapter,
  baseUrl: 'https://yourdomain.co',
  entities: {
    'blog-post': { 
      tableName: 'posts', 
      primaryKey: 'post_id'
    },
    'product': { 
      tableName: 'products', 
      primaryKey: 'id' 
    },
    'campaign': { 
      tableName: 'marketing_campaigns', 
      primaryKey: 'campaign_id' 
    }
  }
});
```

### Legacy Database Configuration (backward compatibility)

```typescript
const longurl = new LongURL({
  database: {
    strategy: 'LOOKUP_TABLE',
    connection: {
      url: process.env.SUPABASE_URL!,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY!
    },
    lookupTable: 'short_urls'
  },
  baseUrl: 'https://yourdomain.co'
});
```

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

## Advanced Usage

### Batch Operations

```typescript
const urls = [
  { urlId: 'abc123', entityType: 'product', entityId: 'prod-1', originalUrl: 'https://...' },
  { urlId: 'def456', entityType: 'product', entityId: 'prod-2', originalUrl: 'https://...' }
];

await adapter.saveBatch(urls);
```

### Real-time Subscriptions

```typescript
// Subscribe to URL changes (Supabase only)
const subscription = adapter.subscribeToChanges((payload) => {
  console.log('URL event:', payload);
});

// Cleanup
subscription.unsubscribe();
```

### Cache Statistics

```typescript
const stats = adapter.getCacheStats();
console.log(stats); // { size: 150, maxSize: 1000, enabled: true }
```

### Health Checks

```typescript
const isHealthy = await longurl.healthCheck();
console.log(isHealthy); // true/false
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
import { LongURL } from 'longurl';

// Option 2: Manual loading
import dotenv from 'dotenv';
dotenv.config();
import { LongURL } from 'longurl';
```

### Next.js Applications

```typescript
// .env.local file (automatically loaded by Next.js)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// pages/api/shorten.ts or app/api/shorten/route.ts
import { LongURL } from 'longurl';

const longurl = new LongURL(); // Uses Next.js env vars
```

### Vite Applications

```typescript
// .env file (automatically loaded by Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// Use with VITE_ prefix
const longurl = new LongURL({
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  }
});
```

### Production Deployments

```bash
# Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Netlify
netlify env:set SUPABASE_URL "https://your-project.supabase.co"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-key"

# Docker
docker run -e SUPABASE_URL="..." -e SUPABASE_SERVICE_ROLE_KEY="..." your-app

# Railway/Render
# Set in dashboard environment variables section
```

## API Reference

### Basic Usage

```typescript
import { LongURL } from 'longurl';

const longurl = new LongURL(); // Uses environment variables
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

### Entity-Centric Organization

```typescript
// Organize URLs by business entities
await longurl.shorten('user', 'user-456', 'https://profile.com', { source: 'share' });
await longurl.shorten('campaign', 'summer-2024', 'https://landing.com', { variant: 'A' });
await longurl.shorten('product', 'widget-789', 'https://checkout.com', { discount: '20OFF' });

// Query by entity
const userUrls = await longurl.getUrlsByEntity('user', 'user-456');
const campaignUrls = await longurl.getUrlsByEntity('campaign', 'summer-2024');
```

### Core Methods

- `new LongURL(config?)` - Create instance with optional configuration
- `longurl.initialize()` - Initialize the adapter connection
- `longurl.shorten(entityType, entityId, url, metadata?)` - Shorten URL with entity context
- `longurl.resolve(urlId)` - Resolve URL and track click
- `longurl.analytics(urlId)` - Get detailed analytics for a URL
- `longurl.getUrlsByEntity(entityType, entityId)` - Get all URLs for an entity
- `longurl.healthCheck()` - Check adapter health
- `longurl.close()` - Close adapter connections

### Error Handling

```typescript
import { LongURL, SupabaseAdapterError } from 'longurl';

try {
  const result = await longurl.shorten('product', 'prod-123', 'https://example.com');
} catch (error) {
  if (error instanceof SupabaseAdapterError) {
    console.error('Database error:', error.message);
    console.error('SQL hint:', error.sqlHint);
    console.error('Context:', error.context);
  }
}
```

## Deployment

### Vercel/Netlify Functions

```typescript
// api/shorten.ts
import 'dotenv/config'; // Only needed for local development
import { LongURL } from 'longurl';

const longurl = new LongURL(); // Uses environment variables

export default async function handler(req, res) {
  try {
    await longurl.initialize();
    const { entityType, entityId, url, metadata } = req.body;
    const result = await longurl.shorten(entityType, entityId, url, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Express.js Server

```typescript
import express from 'express';
import { LongURL } from 'longurl';

const app = express();
const longurl = new LongURL();

app.use(express.json());

// Initialize once at startup
longurl.initialize().then(() => {
  console.log('LongURL initialized');
});

app.post('/api/shorten', async (req, res) => {
  try {
    const { entityType, entityId, url, metadata } = req.body;
    const result = await longurl.shorten(entityType, entityId, url, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/:urlId', async (req, res) => {
  try {
    const resolved = await longurl.resolve(req.params.urlId);
    res.redirect(resolved.originalUrl);
  } catch (error) {
    res.status(404).send('URL not found');
  }
});

app.listen(3000);
```

## Contributing

We're building developer-first URL infrastructure. Contributions welcome!

- **Issues**: Bug reports and feature requests
- **PRs**: Code improvements and new adapters
- **Docs**: Help improve documentation

## License

MIT - Use it however you want.