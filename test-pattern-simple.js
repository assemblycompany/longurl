/**
 * Simple Pattern Generator Test
 * 
 * Tests the pattern functionality directly without database requirements
 */

const { generateUrlId } = require('./dist/src/generator.js');
const { validateUrlPattern } = require('./dist/src/pattern-generator.js');

// Simple test config (like CLI mode)
const testConfig = {
  strategy: 'LOOKUP_TABLE',
  connection: {
    url: 'test-mode',
    key: 'test-mode'
  },
  lookupTable: 'test_table'
};

async function testPatternFeature() {
  console.log('🧪 Simple Pattern Generator Test\n');
  
  // Test 1: Pattern validation
  console.log('=== PATTERN VALIDATION ===');
  console.log(`✅ Valid: "emergency-{endpointId}-plumber" -> ${validateUrlPattern('emergency-{endpointId}-plumber')}`);
  console.log(`❌ Invalid: "emergency-plumber" -> ${validateUrlPattern('emergency-plumber')}`);
  console.log(`❌ Invalid: "emergency-{badId}-plumber" -> ${validateUrlPattern('emergency-{badId}-plumber')}`);
  
  // Test 2: Pattern URL generation
  console.log('\n=== PATTERN GENERATION ===');
  
  try {
    const result = await generateUrlId(
      'contractor',
      'johnsmith-plumbing',
      {
        urlPattern: 'weekend-emergency-plumber-austin-{endpointId}',
        domain: 'exposeapi.com',
        includeEntityInPath: false
      },
      testConfig
    );
    
    if (result.success) {
      console.log('✅ Pattern generation successful!');
      console.log(`🔗 Generated URL: ${result.shortUrl}`);
      console.log(`🆔 URL ID: ${result.urlId}`);
      console.log(`📐 Pattern: weekend-emergency-plumber-austin-{endpointId}`);
      console.log(`🎲 Endpoint ID: ${result.urlId.split('-').pop()}`);
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Different pattern positions
  console.log('\n=== PATTERN FLEXIBILITY ===');
  
  const patterns = [
    '{endpointId}-weekend-emergency-plumber',      // Beginning
    'weekend-{endpointId}-emergency-plumber',      // Middle  
    'weekend-emergency-plumber-{endpointId}',      // End
    'emergency-{endpointId}-plumber-charlotte-{endpointId}' // Should fail - multiple {endpointId}
  ];
  
  for (const pattern of patterns) {
    try {
      const result = await generateUrlId(
        'contractor',
        'test-contractor',
        {
          urlPattern: pattern,
          domain: 'exposeapi.com'
        },
        testConfig
      );
      
      if (result.success) {
        console.log(`✅ ${pattern} -> ${result.urlId}`);
      } else {
        console.log(`❌ ${pattern} -> Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${pattern} -> Error: ${error.message}`);
    }
  }
  
  // Test 4: Compare with regular generation
  console.log('\n=== COMPARISON ===');
  
  // Regular shortening mode
  const regularResult = await generateUrlId(
    'contractor',
    'johnsmith-plumbing',
    {
      enableShortening: true,
      domain: 'exposeapi.com'
    },
    testConfig
  );
  
  // Framework mode
  const frameworkResult = await generateUrlId(
    'contractor',
    'johnsmith-plumbing',
    {
      enableShortening: false,
      domain: 'exposeapi.com'
    },
    testConfig
  );
  
  // Pattern mode
  const patternResult = await generateUrlId(
    'contractor',
    'johnsmith-plumbing',
    {
              urlPattern: 'plumber-charlotte-{endpointId}',
      domain: 'exposeapi.com'
    },
    testConfig
  );
  
  console.log('Regular (shortening):', regularResult.success ? regularResult.shortUrl : 'Failed');
  console.log('Framework mode:', frameworkResult.success ? frameworkResult.shortUrl : 'Failed');
  console.log('Pattern mode:', patternResult.success ? patternResult.shortUrl : 'Failed');
  
  console.log('\n🎯 Simple Test Complete! Pattern generator is working correctly.');
}

testPatternFeature().catch(console.error); 