# Deprecation Notice: endpointId → publicId

## Overview

LongURL is transitioning from `endpointId` to `publicId` for clearer naming and to eliminate confusion with the database `endpoint_id` column.

## What's Changing

### Parameter Naming
- **NEW**: `publicId` - Clear naming for public-facing identifier
- **DEPRECATED**: `endpointId` - Will be removed in a future version

### Pattern Placeholders
- **NEW**: `{publicId}` - Clear placeholder for public identifier
- **DEPRECATED**: `{endpointId}` - Still supported for backward compatibility

## Why This Change?

### The Confusion Problem
```typescript
// Current confusion:
endpointId: 'X7gT5p'        // Parameter: 6-char string for URLs
endpoint_id: 'uuid-123'     // Database column: UUID primary key
```

### The Solution
```typescript
// Clear distinction:
publicId: 'X7gT5p'         // Parameter: 6-char string for URLs  
endpoint_id: 'uuid-123'     // Database column: UUID primary key
```

## Migration Timeline

### ✅ Version 0.3.2 (Current)
- `publicId` parameter added
- `{publicId}` placeholder added
- `endpointId` parameter still supported
- `{endpointId}` placeholder still supported
- **No breaking changes**

### 🔄 Future Version (TBD)
- `endpointId` parameter deprecated with warnings
- `{endpointId}` placeholder deprecated with warnings
- **Soft deprecation - still works**

### ❌ Future Major Version
- `endpointId` parameter removed
- `{endpointId}` placeholder removed
- **Breaking change**

## Migration Guide

### For New Code
```typescript
// ✅ RECOMMENDED: Use publicId
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  publicId: 'LAPTOP2024'
});

// ✅ RECOMMENDED: Use {publicId} in patterns
const result = await longurl.manageUrl('product', 'laptop-123', 'https://...', {}, {
  urlPattern: 'furniture-vintage-table-lamp-{publicId}'
});
```

### For Existing Code
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

### Migration Steps
1. **No immediate action required** - existing code continues to work
2. **When convenient**: Update to use `publicId` instead of `endpointId`
3. **When convenient**: Update patterns to use `{publicId}` instead of `{endpointId}`
4. **Future**: Update when `endpointId` is removed in major version

## Benefits

### Clearer Naming
- `publicId` clearly indicates "what users see in URLs"
- `endpoint_id` clearly indicates "internal database identifier"
- No more confusion between parameter and database column

### Better Developer Experience
- More intuitive parameter names
- Clearer documentation and examples
- Easier to understand the purpose of each field

### Future-Proof
- Aligns with database schema naming
- Prepares for potential database integration features
- Consistent with modern naming conventions

## Technical Details

### Backward Compatibility
- Both `publicId` and `endpointId` parameters work
- Both `{publicId}` and `{endpointId}` placeholders work
- Existing code requires no changes
- Gradual migration path available

### Implementation
- Internal logic prioritizes `publicId` over `endpointId`
- Pattern validation accepts both placeholders
- All existing functionality preserved
- No performance impact

## Questions?

If you have questions about this transition or need help migrating your code, please:
1. Check the updated documentation
2. Review the migration examples above
3. Test with the new `publicId` parameter
4. Report any issues through the project's issue tracker 