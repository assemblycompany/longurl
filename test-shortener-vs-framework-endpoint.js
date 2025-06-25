/**
 * Test: endpointId behavior in Shortener Mode vs Framework Mode
 * 
 * Demonstrates how to configure includeEntityInPath for different use cases
 */

const { generateUrlId } = require('./dist/src/generator.js');

async function testEndpointIdConfigPatterns() {
  console.log("🎯 endpointId Configuration Patterns");
  console.log("📋 Showing config flexibility for different use cases\n");
  
  const testConfig = { strategy: 'LOOKUP_TABLE', connection: { url: 'fake', key: 'fake' } };
  
  // =================================================================
  // SHORTENER MODE: Ultra-Short URLs (Recommended Pattern)
  // =================================================================
  console.log("🔗 SHORTENER MODE - Ultra-Short URLs (Recommended)");
  console.log("   Use case: Social media, SMS, QR codes\n");
  
  const ultraShort = await generateUrlId('campaign', 'summer-sale', {
    domain: 'https://agency.com',
    enableShortening: true,
    includeEntityInPath: false,  // Recommended for ultra-short
    endpointId: 'SALE2024'
  }, testConfig);
  
  console.log("   Config: { enableShortening: true, includeEntityInPath: false }");
  console.log("   Result:", ultraShort.shortUrl);
  console.log("   → Perfect for character-limited contexts\n");
  
  // =================================================================
  // SHORTENER MODE: Organized URLs (Alternative Pattern)
  // =================================================================
  console.log("🏗️ SHORTENER MODE - Organized URLs (Alternative)");
  console.log("   Use case: Internal tracking, branded campaigns\n");
  
  const organizedShort = await generateUrlId('campaign', 'summer-sale', {
    domain: 'https://agency.com',
    enableShortening: true,
    includeEntityInPath: true,   // Alternative: organized structure
    endpointId: 'BRAND2024'
  }, testConfig);
  
  console.log("   Config: { enableShortening: true, includeEntityInPath: true }");
  console.log("   Result:", organizedShort.shortUrl);
  console.log("   → Good for branded campaign URLs\n");
  
  // =================================================================
  // FRAMEWORK MODE: Readable URLs (Standard Pattern)
  // =================================================================
  console.log("📚 FRAMEWORK MODE - Readable URLs");
  console.log("   Use case: SEO-friendly, human-readable URLs\n");
  
  const frameworkUrl = await generateUrlId('campaign', 'summer-sale', {
    domain: 'https://agency.com',
    enableShortening: false,
    includeEntityInPath: true,   // Standard for framework mode
    endpointId: 'summer-emergency-planner'
  }, testConfig);
  
  console.log("   Config: { enableShortening: false, includeEntityInPath: true }");
  console.log("   Result:", frameworkUrl.shortUrl);
  console.log("   → SEO-friendly and descriptive\n");
  
  // =================================================================
  // CONFIGURATION SUMMARY
  // =================================================================
  console.log("⚙️ CONFIGURATION GUIDE:");
  console.log("   Ultra-short URLs:  { enableShortening: true,  includeEntityInPath: false }");
  console.log("   Organized URLs:    { enableShortening: true,  includeEntityInPath: true  }");
  console.log("   Framework URLs:    { enableShortening: false, includeEntityInPath: true  }");
  console.log("\n🎯 ALL PATTERNS ARE VALID - Choose based on your use case!");
}

testEndpointIdConfigPatterns().catch(console.error); 