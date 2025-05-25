# LongURL - Programmable URL Shortener

> **Bitly for developers who want control**

Infra-as-code for URLs. Configure your entities, shorten your URLs, get rich analytics.

## Installation

```bash
npm install longurl
```

## Quick Start

```typescript
import { LongURL } from 'longurl';

// Configure your entities and database
const longurl = new LongURL({
  entities: {
    'product': { 
      tableName: 'products', 
      primaryKey: 'id' 
    },
    'user': { 
      tableName: 'users', 
      primaryKey: 'user_id' 
    }
  },
  database: {
    strategy: 'lookup_table',
    connection: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    }
  },
  domain: 'yourdomain.co'
});

// Shorten URLs
const result = await longurl.shorten('https://very-long-url.com/path', {
  entityType: 'product',
  entityId: 'prod-123',
  metadata: { campaign: 'launch' }
});

console.log(result.shortUrl); // yourdomain.co/product/abc123

// Resolve URLs (with click tracking)
const resolved = await longurl.resolve('abc123');
console.log(resolved.originalUrl); // https://very-long-url.com/path
console.log(resolved.clickCount); // 1

// Get analytics
const analytics = await longurl.analytics('product');
console.log(analytics.totalClicks); // 150
console.log(analytics.clicksByEntity); // { product: 100, user: 50 }
```

## Why LongURL?

### 🔧 **Developer-First**
- `npm install` and go - no SaaS signup required
- Full TypeScript support
- Fits into your existing codebase

### 🏗️ **Programmable**
- Define your own entity types
- Rich metadata support
- Structured analytics by entity

### 🔒 **Own Your Data**
- Self-hostable
- Your database, your rules
- No vendor lock-in

### ⚡ **Enterprise-Ready**
- Built-in collision detection
- Caching for performance
- Configurable storage strategies

## Configuration

### Entity Types
Define entities that make sense for your application:

```typescript
const config = {
  entities: {
    'blog-post': { 
      tableName: 'posts', 
      primaryKey: 'post_id',
      urlPrefix: 'post' // Optional: custom URL prefix
    },
    'author': { 
      tableName: 'authors', 
      primaryKey: 'id' 
    },
    'campaign': { 
      tableName: 'marketing_campaigns', 
      primaryKey: 'campaign_id' 
    }
  }
  // ... rest of config
};
```

### Database Setup

The package automatically creates a `short_urls` table:

```sql
CREATE TABLE "short_urls" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "url_id" VARCHAR(10) NOT NULL UNIQUE,
  "original_url" TEXT NOT NULL,
  "entity_id" TEXT,
  "entity_type" VARCHAR(50),
  "click_count" INTEGER DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

## Use Cases

### SaaS Product Links
```typescript
// Track which features get the most clicks
await longurl.shorten('https://yourapp.com/dashboard', {
  entityType: 'feature',
  entityId: 'dashboard',
  metadata: { customer: 'acme-corp' }
});
```

### E-commerce
```typescript
// Product performance by category
await longurl.shorten('https://shop.com/products/123', {
  entityType: 'product',
  entityId: 'prod-123',
  metadata: { category: 'electronics', price: 299 }
});
```

### Content Marketing
```typescript
// Track content performance
await longurl.shorten('https://blog.com/how-to-guide', {
  entityType: 'blog-post',
  entityId: 'post-456',
  metadata: { author: 'john', topic: 'tutorial' }
});
```

## API Reference

### `new LongURL(config)`
Create a new LongURL instance with your configuration.

### `longurl.shorten(url, options?)`
Shorten a URL with optional entity context.

### `longurl.resolve(urlId)`
Resolve a short URL back to its original URL and increment click count.

### `longurl.analytics(entityType?)`
Get analytics data for all URLs or filtered by entity type.

## Deployment

### Self-Hosted
Deploy anywhere that supports Node.js. Works with:
- Vercel/Netlify Functions
- AWS Lambda
- Docker containers
- Traditional servers

### Database Support
Currently supports Supabase (PostgreSQL). More databases coming soon.

## Contributing

We're building the developer-first URL infrastructure. Contributions welcome!

## License

MIT - Use it however you want. 