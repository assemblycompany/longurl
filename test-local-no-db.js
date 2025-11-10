#!/usr/bin/env node

/**
 * Local test script - No database required
 * Tests URL generation logic without database storage
 * 
 * Usage: 
 *   npm run build && node test-local-no-db.js
 *   OR
 *   npx ts-node test-local-no-db.ts (if ts-node is installed)
 */

// Import directly from source (TypeScript) or dist (JavaScript)
let generateUrlId, DEFAULT_DB_CONFIG;

try {
  // Try compiled version first
  const dist = require('./dist/src/generator');
  const types = require('./dist/types');
  generateUrlId = dist.generateUrlId;
  DEFAULT_DB_CONFIG = types.DEFAULT_DB_CONFIG;
} catch (error) {
  console.error('❌ Error: Please build the project first:');
  console.error('   npm run build');
  console.error('\nOr use TypeScript directly:');
  console.error('   npx ts-node test-local-no-db.ts');
  process.exit(1);
}

// Mock database config - won't actually connect
const mockDbConfig = {
  ...DEFAULT_DB_CONFIG,
  connection: {
    url: 'https://mock.supabase.co',
    key: 'mock-key-for-testing'
  }
};

async function runTests() {
  console.log('🧪 Testing url_slug_short Feature (No Database Required)\n');
  console.log('='.repeat(70) + '\n');

  const tests = [
    {
      name: 'Framework Mode - Readable Slug + Short ID',
      config: {
        enableShortening: false,
        includeEntityInPath: false,
        domain: 'yourdomain.co',
        generate_qr_code: false
      },
      entityType: 'product',
      entityId: 'laptop-dell-xps-13',
      expected: {
        hasUrlSlug: true,
        hasUrlSlugShort: true,
        urlSlugIsReadable: true,
        urlSlugShortIsShort: true
      }
    },
    {
      name: 'Framework Mode - With Entity Path',
      config: {
        enableShortening: false,
        includeEntityInPath: true,
        domain: 'yourdomain.co',
        generate_qr_code: false
      },
      entityType: 'product',
      entityId: 'laptop-dell-xps-13',
      expected: {
        hasUrlSlug: true,
        hasUrlSlugShort: true,
        urlIncludesEntityType: true
      }
    },
    {
      name: 'Shortening Mode - Same ID for Both',
      config: {
        enableShortening: true,
        includeEntityInPath: false,
        domain: 'yourdomain.co',
        generate_qr_code: false
      },
      entityType: 'campaign',
      entityId: 'summer-sale-2024',
      expected: {
        hasUrlSlug: true,
        hasUrlSlugShort: true,
        urlSlugEqualsShort: true
      }
    },
    {
      name: 'Framework Mode - includeInSlug: false',
      config: {
        enableShortening: false,
        includeInSlug: false,
        includeEntityInPath: false,
        domain: 'yourdomain.co',
        generate_qr_code: false
      },
      entityType: 'product',
      entityId: 'laptop-dell-xps-13',
      expected: {
        hasUrlSlug: true,
        hasUrlSlugShort: true,
        publicIdPreserved: true,
        urlSlugIsRandom: true
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`📋 ${test.name}`);
    console.log(`   Config: ${JSON.stringify(test.config, null, 2).split('\n').join('\n   ')}`);
    console.log(`   Entity: ${test.entityType}/${test.entityId}\n`);

    try {
      const result = await generateUrlId(
        test.entityType,
        test.entityId,
        test.config,
        mockDbConfig
      );

      if (!result.success) {
        console.log(`   ❌ Generation failed: ${result.error}\n`);
        failed++;
        continue;
      }

      // Validate results
      const checks = [];
      
      if (test.expected.hasUrlSlug) {
        const has = !!result.urlId;
        checks.push({ name: 'Has url_slug', pass: has, value: result.urlId });
      }

      if (test.expected.hasUrlSlugShort) {
        const has = !!result.url_slug_short;
        checks.push({ name: 'Has url_slug_short', pass: has, value: result.url_slug_short });
      }

      if (test.expected.urlSlugIsReadable) {
        const isReadable = result.urlId === 'laptop-dell-xps-13';
        checks.push({ name: 'url_slug is readable', pass: isReadable, value: result.urlId });
      }

      if (test.expected.urlSlugShortIsShort) {
        const isShort = result.url_slug_short?.length === 6 && result.url_slug_short !== result.urlId;
        checks.push({ name: 'url_slug_short is short (6 chars)', pass: isShort, value: result.url_slug_short });
      }

      if (test.expected.urlIncludesEntityType) {
        const includes = result.shortUrl?.includes('/product/');
        checks.push({ name: 'URL includes entity type', pass: includes, value: result.shortUrl });
      }

      if (test.expected.urlSlugEqualsShort) {
        const equals = result.urlId === result.url_slug_short;
        checks.push({ name: 'url_slug === url_slug_short', pass: equals, value: `${result.urlId} === ${result.url_slug_short}` });
      }

      if (test.expected.publicIdPreserved) {
        const preserved = result.publicId === 'laptop-dell-xps-13';
        checks.push({ name: 'publicId is preserved', pass: preserved, value: result.publicId });
      }

      if (test.expected.urlSlugIsRandom) {
        const isRandom = result.urlId !== 'laptop-dell-xps-13' && result.urlId?.length === 6;
        checks.push({ name: 'url_slug is random (not entity ID)', pass: isRandom, value: result.urlId });
      }

      // Display results
      console.log('   Results:');
      console.log(`   • url_slug: ${result.urlId}`);
      console.log(`   • url_slug_short: ${result.url_slug_short}`);
      console.log(`   • publicId: ${result.publicId}`);
      console.log(`   • Full URL: ${result.shortUrl}`);
      console.log('\n   Checks:');
      
      let allPassed = true;
      for (const check of checks) {
        const icon = check.pass ? '✅' : '❌';
        console.log(`   ${icon} ${check.name}: ${check.value}`);
        if (!check.pass) allPassed = false;
      }

      if (allPassed) {
        console.log('   ✅ Test PASSED\n');
        passed++;
      } else {
        console.log('   ❌ Test FAILED\n');
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failed++;
    }

    console.log('-'.repeat(70) + '\n');
  }

  // Summary
  console.log('='.repeat(70));
  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('\n💡 Note: Some tests may fail if database is required.');
    console.log('   These tests are designed to work without database for URL generation logic.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run migration: migration-add-url-slug-short.sql');
    console.log('   2. Test with database: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('   3. Verify storage: Both slugs stored in same row');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

