/**
 * Test: Can LongURL work without urlPattern?
 * 
 * This test checks if the package allows creating URLs without specifying a urlPattern.
 */

const { LongURL } = require('./dist/index.js');

async function testNoPattern() {
  console.log('🧪 Testing: Can LongURL work without urlPattern?');
  console.log('');

  // Mock configuration for testing
  const mockConfig = {
    baseUrl: 'https://test.com'
  };

  // Test 1: Basic shortening without pattern
  console.log('=== TEST 1: Basic Shortening (No Pattern) ===');
  try {
    const longurl = new LongURL(mockConfig);
    
    // This should work without urlPattern
    const result = await longurl.manageUrl(
      'product',
      'laptop-123', 
      'https://example.com/laptop',
      {},
      {} // No urlPattern specified
    );
    
    console.log('✅ Success: URL created without urlPattern');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    console.log(`   Pattern used: ${result.urlPattern || 'None (default pattern)'}`);
    
  } catch (error) {
    console.log('❌ Error: Cannot create URL without pattern');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 2: Framework mode without pattern
  console.log('=== TEST 2: Framework Mode (No Pattern) ===');
  try {
    const longurl = new LongURL({
      ...mockConfig,
      enableShortening: false // Framework mode
    });
    
    const result = await longurl.manageUrl(
      'product',
      'laptop-dell-xps-13',
      'https://example.com/laptop',
      {},
      {} // No urlPattern specified
    );
    
    console.log('✅ Success: Framework mode works without urlPattern');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    console.log(`   Pattern used: ${result.urlPattern || 'None (default pattern)'}`);
    
  } catch (error) {
    console.log('❌ Error: Framework mode cannot work without pattern');
    console.log(`   ${error.message}`);
  }

  console.log('');

  // Test 3: Check what happens when urlPattern is explicitly null/undefined
  console.log('=== TEST 3: Explicitly No Pattern ===');
  try {
    const longurl = new LongURL(mockConfig);
    
    const result = await longurl.manageUrl(
      'product',
      'laptop-123',
      'https://example.com/laptop', 
      {},
      { urlPattern: undefined } // Explicitly no pattern
    );
    
    console.log('✅ Success: Explicitly no pattern works');
    console.log(`   URL: ${result.shortUrl}`);
    console.log(`   URL ID: ${result.urlId}`);
    
  } catch (error) {
    console.log('❌ Error: Explicitly no pattern fails');
    console.log(`   ${error.message}`);
  }

  console.log('');
  console.log('🎯 Test Complete!');
  console.log('💡 Key Question: Does LongURL require urlPattern or have default patterns?');
}

testNoPattern().catch(console.error); 