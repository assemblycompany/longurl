# LongURL Enhancement: Normalized Entity Relationships

## Problem Statement

LongURL currently stores entity relationships as generic TEXT fields without foreign key constraints:

```sql
entity_id TEXT       -- "uuid-string" (no validation)
entity_type TEXT     -- "contractor" (redundant if entities have types)
```

This approach lacks database-level integrity and creates maintenance overhead in applications with proper normalized schemas.

## Proposed Solution: Normalized Mode

Add optional normalized entity support with proper foreign key constraints:

```sql
entity_id UUID REFERENCES businesses(id)  -- Direct FK constraint
-- entity_type derived from entity relationships
```

## Value Proposition

### 1. **Data Integrity**
- **Current**: No guarantee entity exists in referenced table
- **Normalized**: Database enforces entity existence via FK constraints

### 2. **Performance**
- **Current**: TEXT pattern matching for entity lookups
- **Normalized**: UUID index lookups (significantly faster)

### 3. **Storage Efficiency**
- **Current**: Redundant entity_type stored in every endpoint
- **Normalized**: Type derived from entity's vertical/category relationship

### 4. **Query Simplicity**
- **Current**: Join on TEXT conversion + type filtering
- **Normalized**: Direct UUID joins across related tables

## Use Cases

### E-commerce Platform
```sql
-- Products, Users, Orders all get proper FK relationships
entity_id UUID REFERENCES products(id)
entity_id UUID REFERENCES users(id)  
entity_id UUID REFERENCES orders(id)
```

### Multi-Tenant SaaS
```sql
-- Tenants, Features, Campaigns with enforced relationships
entity_id UUID REFERENCES tenants(id)
entity_id UUID REFERENCES features(id)
```

### Business Directory
```sql
-- Contractors, Restaurants, Clinics with vertical-based typing
entity_id UUID REFERENCES businesses(id)
-- entity_type = businesses.vertical_id → verticals.slug
```

## Configuration Example

```typescript
// Backward compatible (current behavior)
new LongURL({ entityMode: 'generic' })

// New normalized mode
new LongURL({ 
  entityMode: 'normalized',
  entityMappings: {
    'business': 'businesses.id',
    'user': 'users.id',
    'product': 'products.id'
  }
})
```

## Implementation Benefits

1. **Zero Breaking Changes** - Fully backward compatible
2. **Opt-in Enhancement** - Teams choose when to migrate
3. **Database Agnostic** - Works with any SQL database supporting FKs
4. **Performance Gains** - Immediate query performance improvements
5. **Data Quality** - Prevents orphaned URLs from deleted entities

## Target Audience

- **Enterprise applications** with existing normalized schemas
- **High-performance platforms** requiring efficient entity lookups  
- **Data-conscious teams** prioritizing referential integrity
- **Multi-entity systems** (e-commerce, SaaS, directories)

## Success Metrics

- **Query Performance**: 50-80% faster entity lookups via UUID indexes
- **Data Integrity**: Zero orphaned URLs from FK constraints
- **Storage Efficiency**: Reduced redundancy in entity_type columns
- **Developer Experience**: Simplified joins and relationship queries

This enhancement positions LongURL as the choice for enterprise applications requiring both URL management flexibility and database best practices. 