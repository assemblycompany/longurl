/**
 * Test Pattern Generator Feature
 * 
 * Quick test to verify the new urlPattern functionality works
 */

const { LongURL, validateUrlPattern } = require('./dist/index.js');

async function testPatternGenerator() {
  console.log('🧪 Testing Pattern Generator Feature\n');
  
  // Test 1: Pattern validation
  console.log('=== PATTERN VALIDATION ===');
  
  const validPattern = 'weekend-emergency-plumber-austin-{endpointId}';
  const invalidPattern = 'weekend-emergency-plumber-austin'; // Missing {endpointId}
  
  console.log(`✅ Valid pattern: "${validPattern}" -> ${validateUrlPattern(validPattern)}`);
  console.log(`❌ Invalid pattern: "${invalidPattern}" -> ${validateUrlPattern(invalidPattern)}`);
  
  // Test 2: Pattern URL generation (without database - will show graceful degradation)
  console.log('\n=== PATTERN URL GENERATION ===');
  
  try {
    const longurl = new LongURL({
      baseUrl: 'https://exposeapi.com'
    });
    
    console.log('Testing pattern URL generation...');
    
    const result = await longurl.shorten(
      'contractor',
      'johnsmith-plumbing', 
      '/api/contractor/charlotte-plumbing',
      { business: 'Johns Plumbing Services' },
      { urlPattern: 'weekend-emergency-plumber-austin-{endpointId}' }
    );
    
    if (result.success) {
      console.log('✅ Pattern URL generated successfully!');
      console.log(`🔗 URL Slug: ${result.urlSlug}`);
      console.log(`🏠 URL Base: ${result.urlBase}`);
      console.log(`📤 URL Output: ${result.urlOutput}`);
      console.log(`🆔 Pattern: weekend-emergency-plumber-austin-{endpointId}`);
      console.log(`🎲 Generated Endpoint ID: ${result.urlSlug.split('-').pop()}`);
    } else {
      console.log(`❌ Pattern generation failed: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  // Test 3: Compare with regular generation
  console.log('\n=== COMPARISON: Pattern vs Regular ===');
  
  try {
    const longurl = new LongURL({
      baseUrl: 'https://exposeapi.com'
    });
    
    // Regular generation
    const regularResult = await longurl.shorten(
      'contractor',
      'johnsmith-plumbing', 
      '/api/contractor/charlotte-plumbing'
    );
    
    console.log('Regular generation:');
    if (regularResult.success) {
      console.log(`  URL: ${regularResult.urlOutput}`);
      console.log(`  Slug: ${regularResult.urlSlug}`);
    }
    
    // Pattern generation  
    const patternResult = await longurl.shorten(
      'contractor',
      'johnsmith-plumbing', 
      '/api/contractor/charlotte-plumbing',
      {},
      { urlPattern: 'plumber-charlotte-{endpointId}' }
    );
    
    console.log('Pattern generation:');
    if (patternResult.success) {
      console.log(`  URL: ${patternResult.urlOutput}`);
      console.log(`  Slug: ${patternResult.urlSlug}`);
      console.log(`  Pattern: plumber-charlotte-{endpointId}`);
    }
    
  } catch (error) {
    console.log(`Comparison test error: ${error.message}`);
  }
  
  // Test 4: Framework mode compatibility
  console.log('\n=== FRAMEWORK MODE + PATTERN ===');
  
  try {
    const frameworkLongurl = new LongURL({
      enableShortening: false, // Framework mode
      baseUrl: 'https://exposeapi.com'
    });
    
    const frameworkResult = await frameworkLongurl.shorten(
      'contractor',
      'johnsmith-plumbing', 
      '/api/contractor/charlotte-plumbing',
      {},
      { urlPattern: 'emergency-{endpointId}-plumber-charlotte' }
    );
    
    if (frameworkResult.success) {
      console.log('✅ Framework + Pattern works!');
      console.log(`📱 Result: ${frameworkResult.urlOutput}`);
      console.log(`🔧 Note: Pattern overrides framework mode (uses {endpointId} instead of entity ID)`);
    } else {
      console.log(`Framework + Pattern failed: ${frameworkResult.error}`);
    }
    
  } catch (error) {
    console.log(`Framework test error: ${error.message}`);
  }
  
  console.log('\n🎯 Pattern Generator Testing Complete!');
  console.log('💡 Key Features:');
  console.log('   • {endpointId} can be placed anywhere in the pattern');
  console.log('   • Base62 collision detection on full generated URL');
  console.log('   • Graceful degradation without database');
  console.log('   • Works with both shorten() and manageUrl()');
}

testPatternGenerator().catch(console.error); 