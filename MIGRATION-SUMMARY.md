# Migration to Modern Table Schema

## What Changed

We've updated LongURL from a "shortening-focused" schema to a modern "URL management framework" schema with full backwards compatibility.

## New Schema (Recommended)

```sql
-- Modern table name and columns
CREATE TABLE endpoints (
  id UUID PRIMARY KEY,
  url_slug TEXT UNIQUE NOT NULL,  -- The public path segment
  url_base TEXT NOT NULL,         -- Target URL/route
  entity_type TEXT,
  entity_id TEXT,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Legacy Schema (Still Supported)

```sql
-- Legacy table name and columns (still works)
CREATE TABLE short_urls (
  id UUID PRIMARY KEY,
  url_id TEXT UNIQUE NOT NULL,    -- Legacy name for path segment
  original_url TEXT NOT NULL,     -- Legacy name for target
  entity_type TEXT,
  entity_id TEXT,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Backwards Compatibility

The Supabase adapter now **automatically detects** which schema you're using:

1. **New users**: Just run `setup-tables.sql` → gets modern `endpoints` table
2. **Existing users**: Keep using your `short_urls` table → everything works unchanged
3. **Migration**: Run `migration-from-short-urls.sql` → safely migrate your data

## Detection Priority

The adapter checks in this order:
1. `endpoints` table with `url_slug`/`url_base` columns (new schema)
2. `short_urls` table with `url_id`/`original_url` columns (legacy schema)
3. Custom table name with new columns
4. Custom table name with legacy columns

## Zero Breaking Changes

- All TypeScript interfaces remain the same
- All methods work identically
- Environment variables work the same way
- Existing databases continue working without any changes

## Benefits of New Schema

- **Better naming**: `endpoints` reflects both shortening AND framework modes
- **Clearer columns**: `url_slug` and `url_base` are more intuitive
- **Future-proof**: Schema designed for URL management, not just shortening

## Migration Options

**Option 1: Keep using legacy schema** (zero changes needed)
- Your existing `short_urls` table continues working
- No migration needed

**Option 2: Migrate to new schema** (recommended for new clarity)
- Run `migration-from-short-urls.sql`
- Data is safely copied to new `endpoints` table
- Old table is preserved for safety

**Option 3: Fresh install** (for new projects)
- Run `setup-tables.sql` 
- Gets modern schema from day one 