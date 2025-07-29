/**
 * Test script for Shortening Mode (should ignore includeInSlug)
 */

const { generateUrlId } = require('./dist/src/generator.js');

async function testShorteningMode() {
  console.log("🧪 Testing Shortening Mode (includeInSlug should be ignored)\n");
  
  // Test 1: Shortening Mode - includeInSlug: true (should be ignored)
  console.log("1️⃣ Shortening Mode - includeInSlug: true (should be ignored)");
  try {
    const result1 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true, // Shortening Mode
        includeEntityInPath: false,
        includeInSlug: true
      }
    );
    
    console.log("   Result:", {
      success: result1.success,
      urlId: result1.urlId,
      publicId: result1.publicId,
      shortUrl: result1.shortUrl
    });
    
    if (result1.success) {
      console.log("   ✅ urlId matches publicId:", result1.urlId === result1.publicId ? 'YES' : 'NO');
      console.log("   ✅ urlId is random Base62:", result1.urlId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 2: Shortening Mode - includeInSlug: false (should be ignored)
  console.log("2️⃣ Shortening Mode - includeInSlug: false (should be ignored)");
  try {
    const result2 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true, // Shortening Mode
        includeEntityInPath: false,
        includeInSlug: false
      }
    );
    
    console.log("   Result:", {
      success: result2.success,
      urlId: result2.urlId,
      publicId: result2.publicId,
      shortUrl: result2.shortUrl
    });
    
    if (result2.success) {
      console.log("   ✅ urlId matches publicId:", result2.urlId === result2.publicId ? 'YES' : 'NO');
      console.log("   ✅ urlId is random Base62:", result2.urlId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 3: Shortening Mode with provided publicId
  console.log("3️⃣ Shortening Mode - provided publicId");
  try {
    const result3 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true, // Shortening Mode
        includeEntityInPath: false,
        publicId: 'WEEKEND2024'
      }
    );
    
    console.log("   Result:", {
      success: result3.success,
      urlId: result3.urlId,
      publicId: result3.publicId,
      shortUrl: result3.shortUrl
    });
    
    if (result3.success) {
      console.log("   ✅ urlId matches publicId:", result3.urlId === result3.publicId ? 'YES' : 'NO');
      console.log("   ✅ publicId is provided value:", result3.publicId === 'WEEKEND2024' ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
}

testShorteningMode().catch(console.error); 