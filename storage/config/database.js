/**
 * Database Configuration
 * 
 * Centralized configuration for Supabase credentials and settings
 */

const path = require('path');
const fs = require('fs');

// Try to load environment variables from various sources
function loadEnvironmentVariables() {
  const envFiles = [
    '.env.local',
    '.env',
    'supabase/.env.local',
    'supabase/.env'
  ];
  
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Loading environment from: ${envFile}`);
      require('dotenv').config({ path: envPath });
      break;
    }
  }
}

// Load environment variables
loadEnvironmentVariables();

// Configuration object
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.SUPABASE_URL || 
         process.env.SUPABASE_PROJECT_URL,
    
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.SUPABASE_ANON_KEY,
    
    // Project details (if available)
    projectId: process.env.SUPABASE_PROJECT_ID,
    projectRef: process.env.SUPABASE_PROJECT_REF
  },
  
  // Database settings
  database: {
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 10000
  },
  
  // Development settings
  development: {
    enableLogging: process.env.NODE_ENV !== 'production',
    cleanupTestData: true
  }
};

// Validation
function validateConfig() {
  const errors = [];
  
  if (!config.supabase.url) {
    errors.push('Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL, or SUPABASE_PROJECT_URL)');
  }
  
  if (!config.supabase.serviceRoleKey) {
    errors.push('Missing Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    console.error('\n💡 Create a .env.local file with your Supabase credentials:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    return false;
  }
  
  return true;
}

// Export configuration
module.exports = {
  config,
  validateConfig,
  loadEnvironmentVariables
}; 