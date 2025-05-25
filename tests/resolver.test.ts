import { resolveUrlId, clearResolutionCache } from '../src/resolver';
import { StorageStrategy } from '../types';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => mockSupabaseResponse)
          })),
          single: jest.fn(() => mockSupabaseResponse)
        }))
      }))
    }))
  }))
}));

// Shared mock response for Supabase
let mockSupabaseResponse: { data: any; error: any } = { data: null, error: null };

describe('URL Resolver', () => {
  // Set environment variables for tests
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
    
    // Reset mock response
    mockSupabaseResponse = { data: null, error: null };
    
    // Clear cache between tests
    clearResolutionCache();
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });

  const mockDbConfig = {
    strategy: StorageStrategy.INLINE,
    connection: {
      url: 'https://example.supabase.co',
      key: 'mock-service-key'
    }
  };

  const mockEntityConfig = {
    tableName: 'insiders',
    primaryKey: 'insider_id'
  };
  
  describe('resolveUrlId', () => {
    it('should resolve an inline URL ID to its entity', async () => {
      // Mock a successful response
      mockSupabaseResponse = {
        data: {
          id: 'db-123',
          insider_id: 'insider-123',
          name: 'John Doe',
          position: 'CEO',
          url_id: 'Ab1C2d'
        },
        error: null
      };
      
      const result = await resolveUrlId(
        'insider',
        'Ab1C2d',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result.success).toBe(true);
      expect(result.entity).toEqual(mockSupabaseResponse.data);
      expect(result.entityId).toBe('insider-123');
      expect(result.entityType).toBe('insider');
    });
    
    it('should resolve a lookup table URL ID to its entity', async () => {
      // Mock successful lookup table response
      mockSupabaseResponse = {
        data: {
          entity_id: 'company-456',
          entity_type: 'company'
        },
        error: null
      };
      
      // Second response for the entity itself
      const secondResponse = {
        data: {
          company_id: 'company-456',
          company_name: 'Acme Corp',
          ticker: 'ACME'
        },
        error: null
      };
      
      // Override the mock for this specific test
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => mockSupabaseResponse)
            })),
            single: jest.fn(() => secondResponse)
          }))
        }))
      }));
      
      // @ts-ignore: Mocking the supabase client
      require('@supabase/supabase-js').createClient.mockReturnValue({
        from: mockFrom
      });
      
      const result = await resolveUrlId(
        'company',
        'Xy9Z8a',
        { 
          strategy: StorageStrategy.LOOKUP_TABLE,
          connection: {
            url: 'https://example.supabase.co',
            key: 'mock-service-key'
          },
          lookupTable: 'short_urls'
        },
        { tableName: 'companies', primaryKey: 'company_id' }
      );
      
      expect(result.success).toBe(true);
      expect(result.entity).toEqual(secondResponse.data);
      expect(result.entityId).toBe('company-456');
      expect(result.entityType).toBe('company');
      
      // Check that from was called as expected
      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenCalledWith('short_urls');
      expect(mockFrom).toHaveBeenCalledWith('companies');
    });
    
    it('should return error for invalid URL ID format', async () => {
      const result = await resolveUrlId(
        'insider',
        'invalid#id',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL ID format');
      expect(result.entity).toBeUndefined();
    });
    
    it('should return error when URL ID not found', async () => {
      // Mock not found response
      mockSupabaseResponse = {
        data: null,
        error: {
          message: 'No rows found',
          code: 'PGRST116'
        }
      };
      
      const result = await resolveUrlId(
        'filing',
        'Ab1C2d',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No rows found');
      expect(result.entity).toBeUndefined();
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseResponse = {
        data: null,
        error: {
          message: 'Database connection error',
          code: 'CONNECTION_ERROR'
        }
      };
      
      const result = await resolveUrlId(
        'user',
        'Ab1C2d',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection error');
      expect(result.entity).toBeUndefined();
    });
    
    it('should use cached results when available', async () => {
      // First call - mock successful response
      mockSupabaseResponse = {
        data: {
          id: 'insider-789',
          insider_id: 'insider-789',
          name: 'Jane Smith',
          url_id: 'Ef3G4h'
        },
        error: null
      };
      
      // First call should hit the database
      const result1 = await resolveUrlId(
        'insider',
        'Ef3G4h',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result1.success).toBe(true);
      expect(result1.entity).toEqual(mockSupabaseResponse.data);
      
      // Change the mock data - but this shouldn't affect the second call
      // because it should use the cached value
      mockSupabaseResponse = {
        data: {
          id: 'different-id',
          insider_id: 'different-id',
          name: 'Different Name',
          url_id: 'Ef3G4h'
        },
        error: null
      };
      
      // Second call with same ID should use cache
      const result2 = await resolveUrlId(
        'insider',
        'Ef3G4h',
        mockDbConfig,
        mockEntityConfig
      );
      
      // Should still have the original data
      expect(result2.success).toBe(true);
      expect(result2.entity).toEqual(result1.entity);
      expect(result2.entity.name).toBe('Jane Smith');
    });
  });
}); 