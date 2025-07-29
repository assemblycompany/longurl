/**
 * Test script for includeInSlug parameter
 */

const { LongURL } = require('./dist/index.js');

async function testIncludeInSlug() {
  console.log("🧪 Testing includeInSlug Parameter\n");
  
  const longurl = new LongURL({
    baseUrl: 'https://example.com',
    supabase: {
      url: 'https://example.supabase.co',
      key: 'mock-key'
    }
  });
  
  // Test 1: includeInSlug: true (default behavior)
  console.log("1️⃣ Testing includeInSlug: true (default)");
  try {
    const result1 = await longurl.manageUrl(
      'campaign',
      'summer-sale',
      'https://shop.com/sale',
      { source: 'email' },
      { 
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
    const result2 = await longurl.manageUrl(
      'campaign',
      'summer-sale',
      'https://shop.com/sale',
      { source: 'email' },
      { 
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
    const result3 = await longurl.manageUrl(
      'campaign',
      'summer-sale',
      'https://shop.com/sale',
      { source: 'email' },
      { 
        urlPattern: 'summer-sale-{publicId}',
        publicId: 'WEEKEND2024',
        includeInSlug: false
      }
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
    const result4 = await longurl.manageUrl(
      'campaign',
      'summer-sale',
      'https://shop.com/sale',
      { source: 'email' },
      { 
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

testIncludeInSlug().catch(console.error); 