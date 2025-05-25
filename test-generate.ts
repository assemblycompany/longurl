/**
 * Test script for generating opaque URLs
 */

import { generateUrlId } from './src/generator';
import { resolveUrlId } from './src/resolver';
import { EntityType } from './types';

async function testGenerateUrl() {
  console.log('Testing opaque URL generation...');
  
  // Generate URLs for different entity types
  const insiderResult = await generateUrlId(EntityType.INSIDER, 'test-insider-123');
  const companyResult = await generateUrlId(EntityType.COMPANY, 'test-company-456');
  const filingResult = await generateUrlId(EntityType.FILING, 'test-filing-789');
  
  // Display results
  console.log('\nGenerated URLs:');
  console.log('--------------');
  console.log(`Insider: ${insiderResult.success ? insiderResult.urlId : 'Error: ' + insiderResult.error}`);
  console.log(`Company: ${companyResult.success ? companyResult.urlId : 'Error: ' + companyResult.error}`);
  console.log(`Filing: ${filingResult.success ? filingResult.urlId : 'Error: ' + filingResult.error}`);
  
  // Test URL resolution if generation was successful
  if (insiderResult.success) {
    console.log('\nTesting URL resolution...');
    console.log('----------------------');
    try {
      const urlId = insiderResult.urlId;
      console.log(`Resolving URL ID: ${urlId}`);
      
      // This will likely fail in test mode without a real database
      const resolutionResult = await resolveUrlId(EntityType.INSIDER, urlId);
      
      if (resolutionResult.success) {
        console.log('Resolution successful!');
        console.log('Entity:', resolutionResult.entity);
      } else {
        console.log('Resolution failed:', resolutionResult.error);
        console.log('This is expected in test mode without a real database connection.');
      }
    } catch (error) {
      console.error('Error during resolution test:', error);
    }
  }
}

// Run the test
testGenerateUrl().catch(error => {
  console.error('Test failed with error:', error);
}); 