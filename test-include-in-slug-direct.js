/**
 * Test script for includeInSlug parameter (direct function calls)
 */

const { generateUrlId } = require('./dist/src/generator.js');
const { generatePatternUrl } = require('./dist/src/pattern-generator.js');

async function testIncludeInSlugDirect() {
  console.log("🧪 Testing includeInSlug Parameter (Direct Function Calls)\n");
  
  // Test 1: includeInSlug: true (default behavior)
  console.log("1️⃣ Testing includeInSlug: true (default)");
  try {
    const result1 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true,
        includeEntityInPath: false,
        publicId: 'WEEKEND2024',
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
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 2: includeInSlug: false (new behavior)
  console.log("2️⃣ Testing includeInSlug: false");
  try {
    const result2 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true,
        includeEntityInPath: false,
        publicId: 'WEEKEND2024',
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
      console.log("   ✅ urlId different from publicId:", result2.urlId !== result2.publicId ? 'YES' : 'NO');
      console.log("   ✅ publicId preserved:", result2.publicId === 'WEEKEND2024' ? 'YES' : 'NO');
      console.log("   ✅ urlId is random:", result2.urlId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 3: Pattern URL with includeInSlug: false
  console.log("3️⃣ Testing pattern URL with includeInSlug: false");
  try {
    const result3 = await generatePatternUrl(
      'campaign',
      'summer-sale',
      'summer-sale-{publicId}',
      {
        domain: 'https://example.com',
        includeEntityInPath: false,
        publicId: 'WEEKEND2024',
        includeInSlug: false
      },
      { strategy: 'LOOKUP_TABLE', connection: { url: 'fake', key: 'fake' } }
    );
    
    console.log("   Result:", {
      success: result3.success,
      urlId: result3.urlId,
      publicId: result3.publicId,
      shortUrl: result3.shortUrl
    });
    
    if (result3.success) {
      console.log("   ✅ urlId different from publicId:", result3.urlId !== result3.publicId ? 'YES' : 'NO');
      console.log("   ✅ publicId preserved:", result3.publicId === 'WEEKEND2024' ? 'YES' : 'NO');
      console.log("   ✅ urlId contains random slug:", result3.urlId.includes('summer-sale-') ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 4: Auto-generated publicId with includeInSlug: false
  console.log("4️⃣ Testing auto-generated publicId with includeInSlug: false");
  try {
    const result4 = await generateUrlId(
      'campaign',
      'summer-sale',
      {
        domain: 'https://example.com',
        enableShortening: true,
        includeEntityInPath: false,
        includeInSlug: false
      }
    );
    
    console.log("   Result:", {
      success: result4.success,
      urlId: result4.urlId,
      publicId: result4.publicId,
      shortUrl: result4.shortUrl
    });
    
    if (result4.success) {
      console.log("   ✅ urlId different from publicId:", result4.urlId !== result4.publicId ? 'YES' : 'NO');
      console.log("   ✅ both are random:", result4.urlId.length === 6 && result4.publicId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
}

testIncludeInSlugDirect().catch(console.error); 