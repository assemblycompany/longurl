#!/usr/bin/env node

/**
 * Test script for LongURL package using the Amazon URL sample
 */

const { LongURL } = require('./dist/index.js');

// Sample Amazon URL from devdocs/url-sample.md
const sampleUrl = 'https://www.amazon.com/dp/B0D3M8QYWL?ref=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&ref_=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&social_share=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&titleSource=avft-a&previewDoh=1&th=1';

async function testLongURL() {
  console.log('🚀 Testing LongURL with Amazon sample...\n');
  
  // Test both URL modes
  await testUrlMode('Default (shortest URLs - recommended)', false);
  console.log('\n' + '='.repeat(60) + '\n');
  await testUrlMode('Entity-aware URLs (opt-in)', true);
}

async function testUrlMode(modeName, includeEntityInPath) {
  console.log(`📋 Testing: ${modeName}`);
  console.log(`🔧 includeEntityInPath: ${includeEntityInPath}\n`);
  
  // Configuration for testing - shows flexibility with any entity type
  const config = {
    includeEntityInPath,
    entities: {
      item: {
        tableName: 'items',
        primaryKey: 'id'
      },
      listing: {
        tableName: 'listings', 
        primaryKey: 'listing_id'
      }
    },
    database: {
      strategy: 'LOOKUP_TABLE',
      connection: {
        url: process.env.SUPABASE_URL || 'https://example.supabase.co',
        key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
      },
      lookupTable: 'short_urls'
    }
  };
  
  try {
    // Initialize LongURL
    const longurl = new LongURL(config);
    
    console.log('📝 Original URL:');
    console.log(`${sampleUrl}\n`);
    console.log(`📏 Length: ${sampleUrl.length} characters\n`);
    
    // Test URL shortening with flexible entity type
    console.log('⚡ Shortening URL...');
    const result = await longurl.shorten(
      'item',               // entity type - can be anything
      'B0D3M8QYWL',        // entity ID (Amazon ASIN)
      sampleUrl,           // original URL
      {
        title: 'Amazon Product',
        description: 'Sample Amazon product URL',
        tags: ['amazon', 'product', 'test'],
        source: 'api-test'
      }
    );
    
    if (result.success) {
      console.log('✅ URL shortened successfully!');
      console.log(`🔗 Short URL: ${result.shortUrl}`);
      console.log(`🆔 URL ID: ${result.urlId}`);
      console.log(`📊 Compression: ${sampleUrl.length} → ${result.shortUrl.length} chars`);
      console.log(`💾 Space saved: ${((sampleUrl.length - result.shortUrl.length) / sampleUrl.length * 100).toFixed(1)}%`);
      
      // Show URL structure
      if (includeEntityInPath) {
        console.log(`🏗️  URL Structure: domain/entityType/urlId`);
        console.log(`📂 Entity-aware: Organized by business context`);
      } else {
        console.log(`🏗️  URL Structure: domain/urlId`);
        console.log(`⚡ Minimal: Shortest possible URLs`);
      }
      console.log('');
      
    } else {
      console.log(`❌ Shortening error: ${result.error}`);
      
      if (result.error.includes('fetch failed')) {
        console.log('💡 Note: This is expected with mock database config.');
        console.log('   The URL structure would be:');
        if (includeEntityInPath) {
          console.log(`   🔗 https://yourdomain.co/item/Ab1C2d (entity-aware)`);
        } else {
          console.log(`   🔗 https://yourdomain.co/Ab1C2d (minimal)`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (error.message.includes('Supabase')) {
      console.log('\n💡 Note: This is a demo with mock database config.');
      console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for real testing.');
    }
  }
}

// Run the test
testLongURL().then(() => {
  console.log('\n🎯 Configuration Options:');
  console.log('• Config: { includeEntityInPath: true }');
  console.log('• Environment: LONGURL_INCLUDE_ENTITY_IN_PATH=true');
  console.log('• Default: false (shortest URLs - recommended)');
  console.log('\n💡 Use Cases:');
  console.log('• Shortest URLs (default): Social media, SMS, QR codes');
  console.log('• Entity URLs (opt-in): SEO, organized link management');
  console.log('\n📏 Design Philosophy:');
  console.log('• URL shorteners should prioritize BREVITY by default');
  console.log('• Entity organization is available when needed');
}).catch(console.error); 