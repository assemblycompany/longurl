#!/usr/bin/env node

/**
 * Test script for LongURL package using the Amazon URL sample
 */

const { LongURL } = require('./dist/index.js');

// Sample Amazon URL from devdocs/url-sample.md
const sampleUrl = 'https://www.amazon.com/dp/B0D3M8QYWL?ref=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&ref_=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&social_share=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&titleSource=avft-a&previewDoh=1&th=1';

async function testLongURL() {
  console.log('🚀 Testing LongURL with Amazon sample...\n');
  
  // Configuration for testing
  const config = {
    entities: {
      product: {
        tableName: 'products',
        primaryKey: 'id'
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
    
    // Test URL shortening
    console.log('⚡ Shortening URL...');
    const result = await longurl.shorten(
      'product',           // entity type
      'B0D3M8QYWL',       // entity ID (Amazon ASIN)
      sampleUrl,          // original URL
      {
        title: 'Amazon Product',
        description: 'Sample Amazon product URL',
        tags: ['amazon', 'product', 'test']
      }
    );
    
    if (result.success) {
      console.log('✅ URL shortened successfully!');
      console.log(`🔗 Short URL: ${result.shortUrl}`);
      console.log(`🆔 URL ID: ${result.urlId}`);
      console.log(`📊 Compression: ${sampleUrl.length} → ${result.shortUrl.length} chars`);
      console.log(`💾 Space saved: ${((sampleUrl.length - result.shortUrl.length) / sampleUrl.length * 100).toFixed(1)}%\n`);
      
      // Test URL resolution
      console.log('🔍 Resolving short URL...');
      const resolved = await longurl.resolve(result.urlId);
      
      if (resolved.success) {
        console.log('✅ URL resolved successfully!');
        console.log(`📍 Entity Type: ${resolved.entityType}`);
        console.log(`🆔 Entity ID: ${resolved.entityId}`);
        console.log(`🌐 Original URL: ${resolved.originalUrl}`);
        console.log(`📈 Click Count: ${resolved.clickCount || 0}\n`);
        
        // Test analytics
        console.log('📊 Getting analytics...');
        const analytics = await longurl.analytics(result.urlId);
        
        if (analytics.success) {
          console.log('✅ Analytics retrieved!');
          console.log(`👆 Total Clicks: ${analytics.data.totalClicks}`);
          console.log(`📅 Created: ${analytics.data.createdAt}`);
          console.log(`🔄 Last Updated: ${analytics.data.updatedAt}\n`);
        } else {
          console.log(`❌ Analytics error: ${analytics.error}\n`);
        }
        
      } else {
        console.log(`❌ Resolution error: ${resolved.error}\n`);
      }
      
    } else {
      console.log(`❌ Shortening error: ${result.error}\n`);
    }
    
    // Show the power of the system
    console.log('💡 Use Cases:');
    console.log('• Share clean URLs: yoursite.com/p/Ab1C2d');
    console.log('• Track clicks and engagement');
    console.log('• A/B test different landing pages');
    console.log('• Manage affiliate links');
    console.log('• Create branded short domains');
    console.log('• Analytics and attribution tracking\n');
    
    console.log('🎯 Perfect for:');
    console.log('• E-commerce product sharing');
    console.log('• Social media campaigns');
    console.log('• Email marketing');
    console.log('• QR codes');
    console.log('• Mobile apps');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (error.message.includes('Supabase')) {
      console.log('\n💡 Note: This is a demo with mock database config.');
      console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for real testing.');
    }
  }
}

// Run the test
testLongURL().catch(console.error); 