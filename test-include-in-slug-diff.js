/**
 * Test: includeInSlug: false vs true
 * 
 * This test compares what happens to url_base and url_slug when includeInSlug is false vs true
 */

const { LongURL } = require('./dist/index.js');

// Mock adapter for testing
class MockAdapter {
  async initialize() {}
  async save() {}
  async resolve() { return null; }
  async exists() { return false; }
  async incrementClicks() {}
  async getAnalytics() { return null; }
  async close() {}
  async healthCheck() { return true; }
}

async function testIncludeInSlugDifference() {
  console.log('🧪 Testing: includeInSlug: false vs true');
  console.log('');

  const mockConfig = {
    adapter: new MockAdapter(),
    baseUrl: 'https://test.com'
  };

  // Test 1: includeInSlug: true (default) with {publicId} placeholder
  console.log('=== TEST 1: includeInSlug: true (default) ===');
  try {
    const longurl = new LongURL(mockConfig);
    
    const result = await longurl.manageUrl(
      'product',
      'laptop-123', 
      '/hub/earthfare-organic-bananas-{publicId}',  // URL with placeholder
      {},
      { 
        urlPattern: 'earthfare-organic-bananas-{publicId}',
        includeInSlug: true
      }
    );
    
    console.log('✅ includeInSlug: true');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    console.log(`   publicId: ${result.publicId}`);
    console.log(`   urlBase: ${result.urlBase}`);
    console.log(`   originalUrl: ${result.originalUrl}`);
    
  } catch (error) {
    console.log('❌ Error with includeInSlug: true');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 2: includeInSlug: false with {publicId} placeholder
  console.log('=== TEST 2: includeInSlug: false ===');
  try {
    const longurl = new LongURL(mockConfig);
    
    const result = await longurl.manageUrl(
      'product',
      'laptop-123', 
      '/hub/earthfare-organic-bananas-{publicId}',  // URL with placeholder
      {},
      { 
        urlPattern: 'earthfare-organic-bananas-{publicId}',
        includeInSlug: false
      }
    );
    
    console.log('✅ includeInSlug: false');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    console.log(`   publicId: ${result.publicId}`);
    console.log(`   urlBase: ${result.urlBase}`);
    console.log(`   originalUrl: ${result.originalUrl}`);
    
  } catch (error) {
    console.log('❌ Error with includeInSlug: false');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 3: Framework mode with includeInSlug: false
  console.log('=== TEST 3: Framework Mode + includeInSlug: false ===');
  try {
    const longurl = new LongURL({
      ...mockConfig,
      enableShortening: false // Framework mode
    });
    
    const result = await longurl.manageUrl(
      'product',
      'laptop-dell-xps-13',
      '/hub/laptop-dell-xps-13-{publicId}',  // URL with placeholder
      {},
      { 
        includeInSlug: false
      }
    );
    
    console.log('✅ Framework Mode + includeInSlug: false');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    console.log(`   publicId: ${result.publicId}`);
    console.log(`   urlBase: ${result.urlBase}`);
    console.log(`   originalUrl: ${result.originalUrl}`);
    
  } catch (error) {
    console.log('❌ Error with Framework Mode + includeInSlug: false');
    console.log(`   ${error.message}`);
  }

  console.log('');
  console.log('🎯 Test Complete!');
  console.log('💡 Key Question: Does includeInSlug affect url_base or just url_slug?');
}

testIncludeInSlugDifference().catch(console.error); 