const { LongURL } = require('./dist/index.js');

// Mock adapter for testing
const mockAdapter = {
  initialize: async () => {},
  save: async () => {},
  resolve: async () => null,
  close: async () => {},
  healthCheck: async () => true
};

async function testShareableUrl() {
  console.log('🧪 Testing: shareable_url generation in both modes');
  
  const longurl = new LongURL({
    baseUrl: 'https://test.com',
    enableShortening: true,  // Start with Shortening Mode
    includeEntityInPath: false,
    adapter: mockAdapter
  });

  try {
    // Test 1: Shortening Mode
    console.log('\n=== TEST 1: Shortening Mode ===');
    const result1 = await longurl.manageUrl('product', 'laptop-123', 'https://example.com/laptop');
    
    console.log('✅ Shortening Mode');
    console.log(`   URL: ${result1.shortUrl}`);
    console.log(`   URL ID: ${result1.urlId}`);
    console.log(`   publicId: ${result1.publicId}`);
    console.log(`   shareable_url: ${result1.shareable_url}`);
    console.log(`   QR Code: ${result1.qrCode ? 'Generated' : 'Not generated'}`);

    // Test 2: Framework Mode
    console.log('\n=== TEST 2: Framework Mode ===');
    const longurlFramework = new LongURL({
      baseUrl: 'https://test.com',
      enableShortening: false,  // Framework Mode
      includeEntityInPath: false,
      adapter: mockAdapter
    });

    const result2 = await longurlFramework.manageUrl('product', 'laptop-dell-xps-13', 'https://example.com/laptop');
    
    console.log('✅ Framework Mode');
    console.log(`   URL: ${result2.shortUrl}`);
    console.log(`   URL ID: ${result2.urlId}`);
    console.log(`   publicId: ${result2.publicId}`);
    console.log(`   shareable_url: ${result2.shareable_url}`);
    console.log(`   QR Code: ${result2.qrCode ? 'Generated' : 'Not generated'}`);

    // Test 3: Framework Mode with includeInSlug: false
    console.log('\n=== TEST 3: Framework Mode + includeInSlug: false ===');
    const result3 = await longurlFramework.manageUrl('product', 'laptop-dell-xps-13', 'https://example.com/laptop', {}, {
      includeInSlug: false
    });
    
    console.log('✅ Framework Mode + includeInSlug: false');
    console.log(`   URL: ${result3.shortUrl}`);
    console.log(`   URL ID: ${result3.urlId}`);
    console.log(`   publicId: ${result3.publicId}`);
    console.log(`   shareable_url: ${result3.shareable_url}`);
    console.log(`   QR Code: ${result3.qrCode ? 'Generated' : 'Not generated'}`);

    // Test 4: Pattern URLs
    console.log('\n=== TEST 4: Pattern URLs ===');
    const result4 = await longurl.manageUrl('product', 'laptop-123', '/hub/earthfare-organic-bananas-{publicId}', {}, {
      urlPattern: 'earthfare-organic-bananas-{publicId}',
      includeInSlug: false
    });
    
    console.log('✅ Pattern URLs');
    console.log(`   URL: ${result4.shortUrl}`);
    console.log(`   URL ID: ${result4.urlId}`);
    console.log(`   publicId: ${result4.publicId}`);
    console.log(`   shareable_url: ${result4.shareable_url}`);
    console.log(`   QR Code: ${result4.qrCode ? 'Generated' : 'Not generated'}`);

    console.log('\n🎯 Test Complete!');
    console.log('💡 Key Question: Is shareable_url always generated and different from publicId?');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShareableUrl(); 