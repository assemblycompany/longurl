# Storage Adapters

## Overview

LongURL uses a **storage adapter pattern** to support different databases and storage backends. This allows developers to choose their preferred storage solution while maintaining a consistent API.

## Architecture

```
LongURL Core
    ↓
StorageAdapter Interface
    ↓
Concrete Adapters (Supabase, Postgres, Redis, etc.)
```

## StorageAdapter Interface

```typescript
interface StorageAdapter {
  // Core operations
  save(urlId: string, data: EntityData): Promise<void>
  resolve(urlId: string): Promise<EntityData | null>
  exists(urlId: string): Promise<boolean>
  
  // Analytics
  incrementClicks(urlId: string): Promise<void>
  getAnalytics(urlId: string): Promise<AnalyticsData | null>
  
  // Lifecycle
  initialize(): Promise<void>
  close(): Promise<void>
}
```

## Built-in Adapters

### SupabaseAdapter
- **Target**: Startups, rapid prototyping
- **Features**: Real-time, auth, RLS, REST API
- **Best for**: Most use cases

### PostgresAdapter (Future)
- **Target**: Enterprise, existing Postgres infrastructure
- **Features**: Direct SQL, custom schemas
- **Best for**: High performance, custom requirements

### RedisAdapter (Future)
- **Target**: High-speed caching, temporary URLs
- **Features**: In-memory, TTL support
- **Best for**: Session URLs, temporary links

## Usage

```typescript
import { LongURL, SupabaseAdapter } from 'longurl'

// Using built-in adapter
const adapter = new SupabaseAdapter({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY
})

const longurl = new LongURL({
  adapter,
  entities: {
    product: { tableName: 'products', primaryKey: 'id' }
  }
})
```

## Custom Adapters

Want to use DynamoDB, MongoDB, or something else? Just implement the interface:

```typescript
class DynamoAdapter implements StorageAdapter {
  async save(urlId: string, data: EntityData): Promise<void> {
    // Your DynamoDB logic
  }
  
  async resolve(urlId: string): Promise<EntityData | null> {
    // Your resolution logic
  }
  
  // ... implement other methods
}

// Use it
const longurl = new LongURL({
  adapter: new DynamoAdapter(config)
})
```

## Design Principles

1. **Simple Interface**: Minimal methods, maximum flexibility
2. **Async by Default**: All operations return Promises
3. **Error Handling**: Adapters should throw meaningful errors
4. **Performance**: Built-in caching and optimization hooks
5. **Testing**: Each adapter includes comprehensive tests

## Roadmap

- ✅ SupabaseAdapter (v0.1.0)
- 🔄 PostgresAdapter (v0.2.0)
- 📋 RedisAdapter (v0.3.0)
- 📋 Community adapters (MongoDB, DynamoDB, etc.)
