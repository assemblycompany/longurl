#!/usr/bin/env node

/**
 * Test script for url_slug_short feature
 * Tests URL generation without requiring database storage
 * 
 * Usage: node test-url-slug-short.js
 */

const { generateUrlId } = require('./dist/src/generator');
const { DEFAULT_DB_CONFIG } = require('./dist/types');

// Mock database config (won't be used since we're testing generation only)
const mockDbConfig = {
  ...DEFAULT_DB_CONFIG,
  connection: {
    url: 'https://mock.supabase.co',
    key: 'mock-key'
  }
};

async function testUrlSlugShort() {
  console.log('🧪 Testing url_slug_short Feature\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Framework Mode with url_slug_short
  console.log('📋 Test 1: Framework Mode (enableShortening: false)');
  console.log('   Expected: url_slug = readable slug, url_slug_short = random Base62 ID\n');
  
  const result1 = await generateUrlId(
    'product',
    'laptop-dell-xps-13',
    {
      enableShortening: false,
      includeEntityInPath: false,
      domain: 'yourdomain.co',
      generate_qr_code: false  // Skip QR for faster testing
    },
    mockDbConfig
  );

  if (result1.success) {
    console.log('✅ Success!');
    console.log(`   url_slug (readable): ${result1.urlId}`);
    console.log(`   url_slug_short: ${result1.url_slug_short}`);
    console.log(`   Full URL: ${result1.shortUrl}`);
    console.log(`   publicId: ${result1.publicId}`);
    console.log(`   ✓ url_slug_short is different from url_slug: ${result1.url_slug_short !== result1.urlId}`);
    console.log(`   ✓ url_slug_short is Base62 (6 chars): ${result1.url_slug_short?.length === 6}`);
  } else {
    console.log(`❌ Failed: ${result1.error}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Test 2: Framework Mode with entity path
  console.log('📋 Test 2: Framework Mode with entity path');
  console.log('   Expected: url_slug = readable slug, url_slug_short = random Base62 ID\n');
  
  const result2 = await generateUrlId(
    'product',
    'laptop-dell-xps-13',
    {
      enableShortening: false,
      includeEntityInPath: true,
      domain: 'yourdomain.co',
      generate_qr_code: false
    },
    mockDbConfig
  );

  if (result2.success) {
    console.log('✅ Success!');
    console.log(`   url_slug (readable): ${result2.urlId}`);
    console.log(`   url_slug_short: ${result2.url_slug_short}`);
    console.log(`   Full URL: ${result2.shortUrl}`);
    console.log(`   ✓ URL includes entity type: ${result2.shortUrl.includes('/product/')}`);
  } else {
    console.log(`❌ Failed: ${result2.error}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Test 3: Shortening Mode (should have same slug and short)
  console.log('📋 Test 3: Shortening Mode (enableShortening: true)');
  console.log('   Expected: url_slug = short ID, url_slug_short = same ID\n');
  
  const result3 = await generateUrlId(
    'campaign',
    'summer-sale-2024',
    {
      enableShortening: true,
      includeEntityInPath: false,
      domain: 'yourdomain.co',
      generate_qr_code: false
    },
    mockDbConfig
  );

  if (result3.success) {
    console.log('✅ Success!');
    console.log(`   url_slug (short ID): ${result3.urlId}`);
    console.log(`   url_slug_short: ${result3.url_slug_short}`);
    console.log(`   Full URL: ${result3.shortUrl}`);
    console.log(`   ✓ In shortening mode, url_slug_short === url_slug: ${result3.url_slug_short === result3.urlId}`);
  } else {
    console.log(`❌ Failed: ${result3.error}`);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Test 4: Framework Mode with includeInSlug: false
  console.log('📋 Test 4: Framework Mode with includeInSlug: false');
  console.log('   Expected: url_slug = random ID, url_slug_short = different random ID\n');
  
  const result4 = await generateUrlId(
    'product',
    'laptop-dell-xps-13',
    {
      enableShortening: false,
      includeInSlug: false,
      includeEntityInPath: false,
      domain: 'yourdomain.co',
      generate_qr_code: false
    },
    mockDbConfig
  );

  if (result4.success) {
    console.log('✅ Success!');
    console.log(`   url_slug (random): ${result4.urlId}`);
    console.log(`   url_slug_short: ${result4.url_slug_short}`);
    console.log(`   publicId (preserved): ${result4.publicId}`);
    console.log(`   Full URL: ${result4.shortUrl}`);
    console.log(`   ✓ publicId is preserved separately: ${result4.publicId === 'laptop-dell-xps-13'}`);
    console.log(`   ✓ url_slug is random (not entity ID): ${result4.urlId !== 'laptop-dell-xps-13'}`);
  } else {
    console.log(`❌ Failed: ${result4.error}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 Summary:');
  console.log('   • Framework Mode generates both url_slug and url_slug_short');
  console.log('   • Shortening Mode uses same ID for both');
  console.log('   • Both slugs can resolve to the same url_base');
  console.log('   • url_slug_short is always a Base62 ID (6 chars by default)');
  console.log('\n💡 Next Steps:');
  console.log('   • Run migration: migration-add-url-slug-short.sql');
  console.log('   • Test with database: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('   • Verify both slugs resolve to same destination');
}

// Run tests
testUrlSlugShort().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

