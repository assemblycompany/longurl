/**
 * Test script to check what fields are returned in the response
 * Specifically looking for publicId in the response structure
 */

const { LongURL } = require('./dist/index.js');

async function testResponseStructure() {
  console.log("🧪 Testing Response Structure\n");
  
  const longurl = new LongURL({
    baseUrl: 'https://example.com',
    supabase: {
      url: 'https://example.supabase.co',
      key: 'mock-key'
    }
  });
  
  // Test 1: With provided publicId
  console.log("1️⃣ Testing response with provided publicId");
  const result1 = await longurl.manageUrl(
    'product',
    'laptop-123',
    'https://example.com/original-url',
    { title: 'Test Product' },
    { publicId: 'TEST123' }
  );
  
  console.log("Response fields:");
  Object.keys(result1).forEach(key => {
    console.log(`   ${key}: ${JSON.stringify(result1[key])}`);
  });
  console.log();
  
  // Test 2: Without publicId (should generate random)
  console.log("2️⃣ Testing response without publicId");
  const result2 = await longurl.manageUrl(
    'product',
    'laptop-456',
    'https://example.com/original-url-2',
    { title: 'Test Product 2' }
  );
  
  console.log("Response fields:");
  Object.keys(result2).forEach(key => {
    console.log(`   ${key}: ${JSON.stringify(result2[key])}`);
  });
  console.log();
  
  // Check if publicId is in the response
  console.log("🔍 Analysis:");
  console.log(`   publicId in result1: ${'publicId' in result1 ? 'YES' : 'NO'}`);
  console.log(`   publicId in result2: ${'publicId' in result2 ? 'YES' : 'NO'}`);
  console.log(`   urlId in result1: ${'urlId' in result1 ? 'YES' : 'NO'}`);
  console.log(`   urlId in result2: ${'urlId' in result2 ? 'YES' : 'NO'}`);
  
  // Check if urlId contains the publicId
  if (result1.success && result1.urlId === 'TEST123') {
    console.log("   ✅ urlId contains the provided publicId");
  } else {
    console.log("   ❌ urlId does not contain the provided publicId");
  }
}

testResponseStructure().catch(console.error); 