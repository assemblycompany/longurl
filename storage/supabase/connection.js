/**
 * Supabase Connection Utility
 * 
 * Centralized database connection for testing and development
 */

const { createClient } = require('@supabase/supabase-js');
const { config, validateConfig } = require('../config/database');

// Validate configuration before proceeding
if (!validateConfig()) {
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('short_urls')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get table info
 */
async function getTableInfo(tableName = 'short_urls') {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      console.error(`❌ Table '${tableName}' not accessible:`, error.message);
      return null;
    }
    
    console.log(`✅ Table '${tableName}' is accessible`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking table '${tableName}':`, error.message);
    return null;
  }
}

/**
 * Clean up test data (for development)
 */
async function cleanupTestData() {
  try {
    const { error } = await supabase
      .from('short_urls')
      .delete()
      .like('entity_id', 'test-%');
    
    if (error) {
      console.error('❌ Cleanup failed:', error.message);
      return false;
    }
    
    console.log('✅ Test data cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection,
  getTableInfo,
  cleanupTestData,
  config
}; 