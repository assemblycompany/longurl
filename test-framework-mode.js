/**
 * Framework Mode Test
 * 
 * Demonstrates how LongURL can work as a URL management framework
 * instead of just a URL shortener.
 */

const { LongURL } = require('./dist/index.js');

async function testFrameworkMode() {
  console.log('🚀 Testing LongURL Framework Mode\n');
  
  // Example 1: Traditional Shortening Mode (default)
  console.log('=== SHORTENING MODE (Traditional) ===');
  const shortener = new LongURL({ 
    enableShortening: true,
    includeEntityInPath: true,
    baseUrl: 'https://mystore.co'
  });
  
  try {
    // This creates random short IDs
    const shortResult = await shortener.shorten(
      'product', 
      'laptop-dell-xps-13', 
      'https://store.com/products/laptop-dell-xps-13'
    );
    
    if (shortResult.success) {
      console.log('✅ Shortened URL created:');
      console.log(`   Original: https://store.com/products/laptop-dell-xps-13`);
      console.log(`   Short URL: ${shortResult.shortUrl}`);
      console.log(`   URL ID: ${shortResult.urlId} (random Base62)`);
    }
  } catch (error) {
    console.log('⚠️  Shortening test requires database connection');
  }
  
  console.log('\n=== FRAMEWORK MODE (URL Management) ===');
  
  // Example 2: Framework Mode - URL Management without shortening
  const urlManager = new LongURL({ 
    enableShortening: false,
    includeEntityInPath: true,
    baseUrl: 'https://mystore.co'
  });
  
  try {
    // This uses entity IDs directly as URL paths
    const frameworkResult = await urlManager.shorten(
      'product', 
      'laptop-dell-xps-13', 
      'https://store.com/products/laptop-dell-xps-13'
    );
    
    if (frameworkResult.success) {
      console.log('✅ Framework URL created:');
      console.log(`   Original: https://store.com/products/laptop-dell-xps-13`);
      console.log(`   Managed URL: ${frameworkResult.shortUrl}`);
      console.log(`   URL ID: ${frameworkResult.urlId} (readable entity ID)`);
    }
  } catch (error) {
    console.log('⚠️  Framework test requires database connection');
  }
  
  console.log('\n=== COMPARISON ===');
  console.log('Shortening Mode: https://mystore.co/product/X7gT5p');
  console.log('Framework Mode:  https://mystore.co/product/laptop-dell-xps-13');
  
  console.log('\n=== ENVIRONMENT VARIABLE CONTROL ===');
  console.log('Set LONGURL_SHORTEN=false to enable framework mode globally');
  console.log('export LONGURL_SHORTEN=false');
  console.log('# Now all URLs will use entity IDs instead of random IDs');
  
  console.log('\n=== USE CASES ===');
  console.log('Framework Mode Benefits:');
  console.log('• SEO-friendly URLs with readable paths');
  console.log('• Content management with organized URL structure');
  console.log('• E-commerce catalogs with product-based URLs');
  console.log('• User profiles: /user/john-doe instead of /user/X7gT5p');
  console.log('• Still includes analytics, collision detection, entity management');
  
  console.log('\nShortening Mode Benefits:');
  console.log('• Ultra-short URLs for social media, SMS, QR codes');
  console.log('• Character limit scenarios');
  console.log('• Privacy - entity IDs not exposed in URLs');
}

// Test different slug creation scenarios
function testSlugCreation() {
  const { createEntitySlug } = require('./dist/utils.js');
  
  console.log('\n=== SLUG CREATION EXAMPLES ===');
  
  const testIds = [
    'laptop-dell-xps-13',
    'USER_123',
    'Product Name With Spaces!',
    'article@2024',
    'order#12345',
    'user.email@domain.com'
  ];
  
  testIds.forEach(id => {
    const slug = createEntitySlug(id);
    console.log(`${id.padEnd(25)} → ${slug}`);
  });
}

if (require.main === module) {
  testFrameworkMode()
    .then(() => testSlugCreation())
    .then(() => console.log('\n✅ Framework mode test completed!'))
    .catch(console.error);
}

module.exports = { testFrameworkMode, testSlugCreation }; 