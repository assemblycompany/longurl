betatable@Mac opaque-urls-v01 % node storage/tests/connection-test.js
📁 Loading environment from: .env.local
🔍 Testing Supabase Connection & Tables...

1️⃣ Testing database connection...
✅ Database connection successful

2️⃣ Checking table accessibility...
✅ Table 'short_urls' is accessible
✅ Table 'url_analytics' is accessible

3️⃣ Testing RPC function...
✅ RPC function is accessible

4️⃣ Testing basic CRUD operations...
   📝 Testing INSERT...
   ✅ INSERT successful
   📖 Testing SELECT...
   ✅ SELECT successful
   📊 Retrieved: test/test-connection-001
   ✏️  Testing UPDATE...
   ✅ UPDATE successful
   🗑️  Testing DELETE...
   ✅ DELETE successful

🎯 Connection tests completed!
📋 Summary:
   • Database: ✅
   • Tables: ✅
   • Ready for LongURL testing! 🚀
betatable@Mac opaque-urls-v01 % 