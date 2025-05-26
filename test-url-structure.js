#!/usr/bin/env node

/**
 * Test URL structure functionality without database dependencies
 */

const { buildEntityUrl } = require('./dist/utils.js');

console.log('🧪 Testing URL Structure Functions\n');

// Test buildEntityUrl function
console.log('📋 Testing buildEntityUrl function:');

const testCases = [
  {
    domain: 'https://yourdomain.co',
    entityType: 'product',
    urlId: 'X7gT5p',
    expected: 'https://yourdomain.co/product/X7gT5p'
  },
  {
    domain: 'yourdomain.co',
    entityType: 'item',
    urlId: 'Ab1C2d',
    expected: 'https://yourdomain.co/item/Ab1C2d'
  },
  {
    domain: 'https://short.ly',
    entityType: 'campaign',
    urlId: 'Zx9Y8w',
    expected: 'https://short.ly/campaign/Zx9Y8w'
  }
];

testCases.forEach((test, index) => {
  const result = buildEntityUrl(test.domain, test.entityType, test.urlId);
  const passed = result === test.expected;
  
  console.log(`${index + 1}. ${passed ? '✅' : '❌'} ${test.domain} + ${test.entityType} + ${test.urlId}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got:      ${result}`);
  console.log('');
});

console.log('🎯 URL Structure Comparison:');
console.log('• Minimal:      https://yourdomain.co/X7gT5p (DEFAULT - shortest)');
console.log('• Entity-aware: https://yourdomain.co/product/X7gT5p (opt-in)');
console.log('');
console.log('💡 Configuration:');
console.log('• Default: includeEntityInPath: false (shortest URLs)');
console.log('• Config:  includeEntityInPath: true (entity-aware URLs)');
console.log('• Env var: LONGURL_INCLUDE_ENTITY_IN_PATH=true');
console.log('');
console.log('📏 Design Philosophy:');
console.log('• URL shorteners should default to SHORTEST possible URLs');
console.log('• Entity-aware URLs are available when organization > brevity'); 