#!/usr/bin/env node

/**
 * LongURL Integration Test
 * 
 * Tests the actual LongURL functionality with real Supabase database
 */

const { LongURL } = require('../../dist/index.js');
const { cleanupTestData, config } = require('../supabase/connection');

// Sample URLs for testing
const testUrls = [
  {
    entityType: 'product',
    entityId: 'test-product-001',
    url: 'https://example.com/products/amazing-widget?utm_source=test&utm_campaign=integration',
    metadata: { category: 'electronics', price: 99.99, test: true }
  },
  {
    entityType: 'blog-post',
    entityId: 'test-post-001', 
    url: 'https://blog.example.com/how-to-build-url-shortener?ref=integration-test',
    metadata: { author: 'test-user', tags: ['tech', 'tutorial'], test: true }
  },
  {
    entityType: 'campaign',
    entityId: 'test-campaign-001',
    url: 'https://landing.example.com/special-offer?discount=20&source=email',
    metadata: { campaign_type: 'email', discount: 20, test: true }
  }
];

async function runIntegrationTests() {
  console.log('🚀 LongURL Integration Test with Real Database\n');
  
  // Cleanup any existing test data
  console.log('🧹 Cleaning up existing test data...');
  await cleanupTestData();
  console.log('');
  
  // Test both URL modes
  await testUrlMode('Minimal URLs (default)', false);
  console.log('\n' + '='.repeat(60) + '\n');
  await testUrlMode('Entity-prefixed URLs', true);
  
  // Cleanup after tests
  console.log('\n🧹 Cleaning up test data...');
  await cleanupTestData();
  
  console.log('\n🎯 Integration tests completed! ✅');
}

async function testUrlMode(modeName, includeEntityInPath) {
  console.log(`📋 Testing: ${modeName}`);
  console.log(`🔧 includeEntityInPath: ${includeEntityInPath}\n`);
  
  try {
    // Initialize LongURL with real configuration
    const longurl = new LongURL({
      includeEntityInPath,
      baseUrl: 'https://yourdomain.co', // This will be in the generated URLs
      supabase: {
        url: config.supabase.url,
        key: config.supabase.serviceRoleKey
      }
    });
    
    await longurl.initialize();
    console.log('✅ LongURL initialized successfully\n');
    
    const results = [];
    
    // Test URL shortening for each test case
    for (let i = 0; i < testUrls.length; i++) {
      const testCase = testUrls[i];
      console.log(`${i + 1}️⃣ Testing: ${testCase.entityType}/${testCase.entityId}`);
      console.log(`   📝 Original: ${testCase.url}`);
      console.log(`   📏 Length: ${testCase.url.length} characters`);
      
      try {
        const result = await longurl.shorten(
          testCase.entityType,
          testCase.entityId,
          testCase.url,
          testCase.metadata
        );
        
        if (result.success) {
          console.log(`   ✅ Shortened successfully!`);
          console.log(`   🔗 Short URL: ${result.shortUrl}`);
          console.log(`   🆔 URL ID: ${result.urlId}`);
          console.log(`   📊 Compression: ${testCase.url.length} → ${result.shortUrl.length} chars`);
          console.log(`   💾 Space saved: ${((testCase.url.length - result.shortUrl.length) / testCase.url.length * 100).toFixed(1)}%`);
          
          results.push({
            ...result,
            originalLength: testCase.url.length,
            compressionRatio: ((testCase.url.length - result.shortUrl.length) / testCase.url.length * 100).toFixed(1)
          });
          
        } else {
          console.log(`   ❌ Shortening failed: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Test URL resolution
    if (results.length > 0) {
      console.log('🔍 Testing URL Resolution...\n');
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log(`${i + 1}️⃣ Resolving: ${result.urlId}`);
        
        try {
          const resolved = await longurl.resolve(result.urlId);
          
          if (resolved.success) {
            console.log(`   ✅ Resolved successfully!`);
            console.log(`   🔗 Original URL: ${resolved.originalUrl}`);
            console.log(`   🏷️  Entity: ${resolved.entityType}/${resolved.entityId}`);
            console.log(`   📊 Metadata: ${JSON.stringify(resolved.metadata)}`);
          } else {
            console.log(`   ❌ Resolution failed: ${resolved.error}`);
          }
          
        } catch (error) {
          console.log(`   💥 Resolution error: ${error.message}`);
        }
        
        console.log('');
      }
    }
    
    // Test analytics
    if (results.length > 0) {
      console.log('📈 Testing Analytics...\n');
      
      const firstResult = results[0];
      console.log(`📊 Getting analytics for: ${firstResult.urlId}`);
      
      try {
        const analytics = await longurl.analytics(firstResult.urlId);
        
        if (analytics.success) {
          console.log(`   ✅ Analytics retrieved!`);
          console.log(`   👆 Total clicks: ${analytics.data.totalClicks}`);
          console.log(`   📅 Created: ${analytics.data.createdAt}`);
          console.log(`   🕐 Last click: ${analytics.data.lastClickAt || 'Never'}`);
        } else {
          console.log(`   ❌ Analytics failed: ${analytics.error}`);
        }
        
      } catch (error) {
        console.log(`   💥 Analytics error: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Summary
    console.log('📋 Summary:');
    console.log(`   • URLs shortened: ${results.length}/${testUrls.length}`);
    console.log(`   • Average compression: ${results.length > 0 ? (results.reduce((sum, r) => sum + parseFloat(r.compressionRatio), 0) / results.length).toFixed(1) : 0}%`);
    console.log(`   • URL structure: ${includeEntityInPath ? 'domain/entity/urlId' : 'domain/urlId'}`);
    
  } catch (error) {
    console.error('💥 Test setup failed:', error.message);
  }
}

// Run the integration tests
runIntegrationTests().catch(console.error); 