#!/usr/bin/env node

/**
 * Database Connection Test
 * 
 * Tests the Supabase connection and table setup
 */

const { testConnection, getTableInfo, supabase } = require('../supabase/connection');

async function runConnectionTests() {
  console.log('🔍 Testing Supabase Connection & Tables...\n');
  
  // Test 1: Basic connection
  console.log('1️⃣ Testing database connection...');
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    console.log('❌ Connection test failed. Exiting.');
    process.exit(1);
  }
  
  console.log('');
  
  // Test 2: Check tables exist
  console.log('2️⃣ Checking table accessibility...');
  const shortUrlsOk = await getTableInfo('short_urls');
  const analyticsOk = await getTableInfo('url_analytics');
  
  console.log('');
  
  // Test 3: Check RPC function
  console.log('3️⃣ Testing RPC function...');
  try {
    const { data, error } = await supabase.rpc('increment_click_count', {
      url_id_param: 'test-function-check'
    });
    
    // This should fail gracefully (URL doesn't exist) but function should be callable
    if (error && !error.message.includes('No rows')) {
      console.log('⚠️  RPC function may not be available:', error.message);
    } else {
      console.log('✅ RPC function is accessible');
    }
  } catch (error) {
    console.log('⚠️  RPC function test failed:', error.message);
  }
  
  console.log('');
  
  // Test 4: Basic CRUD operations
  console.log('4️⃣ Testing basic CRUD operations...');
  
  const testUrlId = 'TEST01';
  const testData = {
    url_id: testUrlId,
    entity_type: 'test',
    entity_id: 'test-connection-001',
    original_url: 'https://example.com/test',
    metadata: { test: true, timestamp: new Date().toISOString() }
  };
  
  try {
    // INSERT
    console.log('   📝 Testing INSERT...');
    const { error: insertError } = await supabase
      .from('short_urls')
      .insert(testData);
    
    if (insertError) {
      console.log('   ❌ INSERT failed:', insertError.message);
    } else {
      console.log('   ✅ INSERT successful');
    }
    
    // SELECT
    console.log('   📖 Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('short_urls')
      .select('*')
      .eq('url_id', testUrlId)
      .single();
    
    if (selectError) {
      console.log('   ❌ SELECT failed:', selectError.message);
    } else {
      console.log('   ✅ SELECT successful');
      console.log(`   📊 Retrieved: ${selectData.entity_type}/${selectData.entity_id}`);
    }
    
    // UPDATE
    console.log('   ✏️  Testing UPDATE...');
    const { error: updateError } = await supabase
      .from('short_urls')
      .update({ click_count: 1 })
      .eq('url_id', testUrlId);
    
    if (updateError) {
      console.log('   ❌ UPDATE failed:', updateError.message);
    } else {
      console.log('   ✅ UPDATE successful');
    }
    
    // DELETE
    console.log('   🗑️  Testing DELETE...');
    const { error: deleteError } = await supabase
      .from('short_urls')
      .delete()
      .eq('url_id', testUrlId);
    
    if (deleteError) {
      console.log('   ❌ DELETE failed:', deleteError.message);
    } else {
      console.log('   ✅ DELETE successful');
    }
    
  } catch (error) {
    console.log('   ❌ CRUD test failed:', error.message);
  }
  
  console.log('\n🎯 Connection tests completed!');
  console.log('📋 Summary:');
  console.log(`   • Database: ${connectionOk ? '✅' : '❌'}`);
  console.log(`   • Tables: ${shortUrlsOk && analyticsOk ? '✅' : '❌'}`);
  console.log('   • Ready for LongURL testing! 🚀');
}

// Run tests
runConnectionTests().catch(console.error); 