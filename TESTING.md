# Testing url_slug_short Feature (No Database Required)

## Quick Test Options

### Option 1: Using npm scripts (Recommended)

```bash
# Build and run comprehensive tests
npm run test:local

# Or test just url_slug_short feature
npm run test:url-slug-short
```

### Option 2: Using the CLI (Zero Setup)

```bash
# Build first
npm run build

# Test with CLI (no database needed)
npx longurl test product laptop-dell-xps-13 yourdomain.co

# Test framework mode specifically
npx longurl test product laptop-dell-xps-13 yourdomain.co --framework
```

### Option 3: Direct Node.js Script

```bash
# Build first
npm run build

# Run test script directly
node test-local-no-db.js

# Or the simpler version
node test-url-slug-short.js
```

## What Gets Tested

The test scripts verify:

1. **Framework Mode** - Generates both `url_slug` (readable) and `url_slug_short` (random Base62)
2. **Shortening Mode** - Uses same ID for both slugs
3. **Entity Path** - URL construction with/without entity type prefix
4. **includeInSlug: false** - Opaque URLs with preserved publicId

## Expected Output

```
🧪 Testing url_slug_short Feature

📋 Test 1: Framework Mode (enableShortening: false)
✅ Success!
   url_slug (readable): laptop-dell-xps-13
   url_slug_short: X7gT5p
   Full URL: https://yourdomain.co/laptop-dell-xps-13
   ✓ url_slug_short is different from url_slug: true
   ✓ url_slug_short is Base62 (6 chars): true
```

## How It Works Without Database

The code has **graceful degradation**:
- URL generation works without database
- Collision detection is skipped (warns but continues)
- Storage operations fail gracefully
- Perfect for testing URL structure and logic

## Next Steps

Once you verify the logic works:

1. **Add database** - Run `migration-add-url-slug-short.sql`
2. **Set environment variables**:
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your-key
   ```
3. **Test with storage** - URLs will be saved to database
4. **Verify both slugs resolve** - Test that both `url_slug` and `url_slug_short` resolve to same `url_base`

## Troubleshooting

**"Cannot find module './dist/..."**
- Run `npm run build` first

**"Database connection failed"**
- This is expected! The tests work without database
- The warnings are normal - URL generation continues

**Tests fail**
- Check that you've built the project: `npm run build`
- Make sure you're using Node.js 16+

