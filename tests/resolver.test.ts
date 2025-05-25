import { resolveUrlId, clearResolutionCache } from '../src/resolver';
import { StorageStrategy } from '../types';

// Mock the Supabase client
const mockSingle = jest.fn();
const mockEq: jest.Mock = jest.fn();
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

// Set up the chaining for eq calls
mockEq.mockImplementation(() => ({ eq: mockEq, single: mockSingle }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom
  }))
}));

describe('URL Resolver', () => {
  // Set environment variables for tests
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the mock implementation
    mockEq.mockImplementation(() => ({ eq: mockEq, single: mockSingle }));
    
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
    tableName: 'products',
    primaryKey: 'product_id'
  };
  
  describe('resolveUrlId', () => {
    it('should resolve an inline URL ID to its entity', async () => {
      // Mock a successful response
      const mockData = {
        id: 'db-123',
        product_id: 'product-123',
        name: 'Sample Product',
        price: 99.99,
        url_id: 'Ab1C2d'
      };
      
      mockSingle.mockResolvedValue({ data: mockData, error: null });
      
      const result = await resolveUrlId(
        'product',
        'Ab1C2d',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result.success).toBe(true);
      expect(result.entity).toEqual(mockData);
      expect(result.entityId).toBe('product-123');
      expect(result.entityType).toBe('product');
    });
    
    it('should resolve a lookup table URL ID to its entity', async () => {
      // Mock successful lookup table response
      const lookupData = {
        entity_id: 'customer-456',
        entity_type: 'customer',
        original_url: 'https://example.com'
      };
      
      const entityData = {
        customer_id: 'customer-456',
        customer_name: 'Acme Corp',
        email: 'contact@acme.com'
      };
      
      // First call returns lookup data, second call returns entity data
      mockSingle
        .mockResolvedValueOnce({ data: lookupData, error: null })
        .mockResolvedValueOnce({ data: entityData, error: null });
      
      const result = await resolveUrlId(
        'customer',
        'Xy9Z8a',
        { 
          strategy: StorageStrategy.LOOKUP_TABLE,
          connection: {
            url: 'https://example.supabase.co',
            key: 'mock-service-key'
          },
          lookupTable: 'short_urls'
        },
        { tableName: 'customers', primaryKey: 'customer_id' }
      );
      
      expect(result.success).toBe(true);
      expect(result.entity).toEqual(entityData);
      expect(result.entityId).toBe('customer-456');
      expect(result.entityType).toBe('customer');
      
      // Check that from was called as expected
      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenCalledWith('short_urls');
      expect(mockFrom).toHaveBeenCalledWith('customers');
    });
    
    it('should return error for invalid URL ID format', async () => {
      const result = await resolveUrlId(
        'product',
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
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          message: 'No rows found',
          code: 'PGRST116'
        }
      });
      
      const result = await resolveUrlId(
        'document',
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
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          message: 'Database connection error',
          code: 'CONNECTION_ERROR'
        }
      });
      
      const result = await resolveUrlId(
        'article',
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
      const mockData = {
        id: 'product-789',
        product_id: 'product-789',
        name: 'Cached Product',
        url_id: 'Ef3G4h'
      };
      
      mockSingle.mockResolvedValue({ data: mockData, error: null });
      
      // First call should hit the database
      const result1 = await resolveUrlId(
        'product',
        'Ef3G4h',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result1.success).toBe(true);
      expect(result1.entity).toEqual(mockData);
      
      // Change the mock data - but this shouldn't affect the second call
      // because it should use the cached value
      const differentMockData = {
        id: 'different-id',
        product_id: 'different-product',
        name: 'Different Product',
        url_id: 'Ef3G4h'
      };
      
      mockSingle.mockResolvedValue({ data: differentMockData, error: null });
      
      // Second call should use cached result
      const result2 = await resolveUrlId(
        'product',
        'Ef3G4h',
        mockDbConfig,
        mockEntityConfig
      );
      
      expect(result2.success).toBe(true);
      expect(result2.entity).toEqual(mockData); // Should still be the original cached data
      
      // Database should only have been called once
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });
  });
}); 