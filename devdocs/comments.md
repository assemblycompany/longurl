src/
├── adapters/
│   ├── supabase/
│   │   ├── SupabaseAdapter.ts         # Main adapter class
│   │   ├── supabase.types.ts          # SupabaseConfig, schema types
│   │   ├── supabase.utils.ts          # Optional helpers (e.g. cache mgmt)
│   │   └── supabase.schema.sql        # Table definitions (optional)
├── core/
│   ├── storage/
│   │   ├── StorageAdapter.ts          # Abstract base class
│   │   └── types.ts                   # Shared types: EntityData, AnalyticsData
├── index.ts                           # Main export entry
