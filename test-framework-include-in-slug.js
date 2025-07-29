/**
 * Test script for includeInSlug parameter in Framework Mode
 */

const { generateUrlId } = require('./dist/src/generator.js');

async function testFrameworkIncludeInSlug() {
  console.log("🧪 Testing includeInSlug Parameter in Framework Mode\n");
  
  // Test 1: Framework Mode with includeInSlug: true (default)
  console.log("1️⃣ Framework Mode - includeInSlug: true (default)");
  try {
    const result1 = await generateUrlId(
      'product',
      'laptop-dell-xps-13',
      {
        domain: 'https://example.com',
        enableShortening: false, // Framework Mode
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
      console.log("   ✅ urlId is entity slug:", result1.urlId === 'laptop-dell-xps-13' ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 2: Framework Mode with includeInSlug: false
  console.log("2️⃣ Framework Mode - includeInSlug: false");
  try {
    const result2 = await generateUrlId(
      'product',
      'laptop-dell-xps-13',
      {
        domain: 'https://example.com',
        enableShortening: false, // Framework Mode
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
      console.log("   ✅ urlId different from publicId:", result2.urlId !== result2.publicId ? 'YES' : 'NO');
      console.log("   ✅ publicId is entity slug:", result2.publicId === 'laptop-dell-xps-13' ? 'YES' : 'NO');
      console.log("   ✅ urlId is random:", result2.urlId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
  console.log();
  
  // Test 3: Framework Mode with provided publicId and includeInSlug: false
  console.log("3️⃣ Framework Mode - provided publicId with includeInSlug: false");
  try {
    const result3 = await generateUrlId(
      'product',
      'laptop-dell-xps-13',
      {
        domain: 'https://example.com',
        enableShortening: false, // Framework Mode
        includeEntityInPath: false,
        publicId: 'DELL-XPS-13-2024',
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
      console.log("   ✅ publicId preserved:", result3.publicId === 'DELL-XPS-13-2024' ? 'YES' : 'NO');
      console.log("   ✅ urlId is random:", result3.urlId.length === 6 ? 'YES' : 'NO');
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }
}

testFrameworkIncludeInSlug().catch(console.error); 