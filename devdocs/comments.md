betatable@Mac opaque-urls-v01 % node test-sample.js
🚀 Testing LongURL with Amazon sample...

📝 Original URL:
https://www.amazon.com/dp/B0D3M8QYWL?ref=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&ref_=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&social_share=cm_sw_r_cso_cp_apin_dp_WZTG72PJC2YCXA83RWBF&titleSource=avft-a&previewDoh=1&th=1

📏 Length: 227 characters

⚡ Shortening URL...
Error checking collision: TypeError: fetch failed
🔥 Supabase Adapter Error: {
  code: 'UNKNOWN',
  message: 'save failed: TypeError: fetch failed',
  suggestion: 'Check the error details and Supabase logs for more information. This might be a network issue or unexpected database constraint.',
  sqlHint: undefined,
  docsUrl: 'https://supabase.com/docs/guides/platform/logs',
  context: { operation: 'save', tableName: 'short_urls' },
  originalError: {
    message: 'TypeError: fetch failed',
    details: 'TypeError: fetch failed\n' +
      '    at node:internal/deps/undici/undici:13502:13\n' +
      '    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
      '    at async SupabaseAdapter.save (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/adapters/supabase/SupabaseAdapter.js:107:31)\n' +
      '    at async LongURL.shorten (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/index.js:111:13)\n' +
      '    at async testLongURL (/Users/betatable/Desktop/beastmode/opaque-urls-v01/test-sample.js:47:20)',
    hint: '',
    code: ''
  }
}
🔥 Supabase Adapter Error: {
  code: 'UNKNOWN',
  message: 'save failed: save failed: TypeError: fetch failed',
  suggestion: 'Check the error details and Supabase logs for more information. This might be a network issue or unexpected database constraint.',
  sqlHint: undefined,
  docsUrl: 'https://supabase.com/docs/guides/platform/logs',
  context: { operation: 'save', tableName: 'short_urls' },
  originalError: SupabaseAdapterError: save failed: TypeError: fetch failed
      at parseSupabaseError (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/adapters/supabase/errors.js:124:20)
      at SupabaseAdapter.handleError (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/adapters/supabase/SupabaseAdapter.js:40:66)
      at SupabaseAdapter.save (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/adapters/supabase/SupabaseAdapter.js:119:22)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async LongURL.shorten (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/index.js:111:13)
      at async testLongURL (/Users/betatable/Desktop/beastmode/opaque-urls-v01/test-sample.js:47:20) {
    code: 'UNKNOWN',
    suggestion: 'Check the error details and Supabase logs for more information. This might be a network issue or unexpected database constraint.',
    sqlHint: undefined,
    docsUrl: 'https://supabase.com/docs/guides/platform/logs',
    originalError: {
      message: 'TypeError: fetch failed',
      details: 'TypeError: fetch failed\n' +
        '    at node:internal/deps/undici/undici:13502:13\n' +
        '    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
        '    at async SupabaseAdapter.save (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/adapters/supabase/SupabaseAdapter.js:107:31)\n' +
        '    at async LongURL.shorten (/Users/betatable/Desktop/beastmode/opaque-urls-v01/dist/src/index.js:111:13)\n' +
        '    at async testLongURL (/Users/betatable/Desktop/beastmode/opaque-urls-v01/test-sample.js:47:20)',
      hint: '',
      code: ''
    }
  }
}
❌ Shortening error: Failed to shorten URL: save failed: save failed: TypeError: fetch failed

💡 Use Cases:
• Share clean URLs: yoursite.com/item/Ab1C2d
• Track clicks and engagement
• A/B test different landing pages
• Manage affiliate links
• Create branded short domains
• Analytics and attribution tracking

🎯 Perfect for:
• E-commerce product sharing
• Social media campaigns
• Email marketing
• QR codes
• Mobile apps
• Any entity-based URL management
betatable@Mac opaque-urls-v01 % 