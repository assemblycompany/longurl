import { generateUrlId, validateUrlId } from '../src/generator';
import { StorageStrategy, DEFAULT_DB_CONFIG } from '../types';
import * as collision from '../src/collision';

// Mock the collision module
jest.mock('../src/collision', () => ({
  checkCollision: jest.fn()
}));

describe('URL Generator', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('generateUrlId', () => {
    it('should generate a valid URL ID when there are no collisions', async () => {
      // Mock no collision
      (collision.checkCollision as jest.Mock).mockResolvedValue(false);
      
      const result = await generateUrlId(
        'product',
        'product-123'
      );
      
      expect(result.success).toBe(true);
      expect(result.urlId).toBeDefined();
      expect(result.urlId!.length).toBe(6);
      expect(validateUrlId(result.urlId!)).toBe(true);
      
      // Verify collision check was called
      expect(collision.checkCollision).toHaveBeenCalledTimes(1);
      expect(collision.checkCollision).toHaveBeenCalledWith(
        'product',
        expect.any(String),
        DEFAULT_DB_CONFIG
      );
    });
    
    it('should handle collisions by generating a new ID', async () => {
      // Mock first attempt has collision, second attempt does not
      (collision.checkCollision as jest.Mock)
        .mockResolvedValueOnce(true)   // First call - collision
        .mockResolvedValueOnce(false); // Second call - no collision
      
      const result = await generateUrlId(
        'customer',
        'customer-123'
      );
      
      expect(result.success).toBe(true);
      expect(result.urlId).toBeDefined();
      expect(result.urlId!.length).toBe(6);
      
      // Verify collision check was called twice
      expect(collision.checkCollision).toHaveBeenCalledTimes(2);
    });
    
    it('should return an error after max collision attempts', async () => {
      // Mock persistent collisions
      (collision.checkCollision as jest.Mock).mockResolvedValue(true);
      
      const result = await generateUrlId(
        'document',
        'document-123'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate unique ID');
      expect(result.urlId).toBe('');
      
      // Verify collision check was called 4 times (attempts 1-4, then stops at MAX_ATTEMPTS=5)
      expect(collision.checkCollision).toHaveBeenCalledTimes(4);
    });
    
    it('should respect custom ID length', async () => {
      // Mock no collision
      (collision.checkCollision as jest.Mock).mockResolvedValue(false);
      
      const customLength = 8;
      const result = await generateUrlId(
        'article',
        'article-123',
        { idLength: customLength }
      );
      
      expect(result.success).toBe(true);
      expect(result.urlId!.length).toBe(customLength);
      expect(validateUrlId(result.urlId!, customLength)).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock an error during collision check
      (collision.checkCollision as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );
      
      const result = await generateUrlId(
        'product',
        'product-123'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error generating URL');
      expect(result.urlId).toBe('');
    });
  });
  
  describe('validateUrlId', () => {
    it('should validate correct URL IDs', () => {
      expect(validateUrlId('Abc123')).toBe(true);
      expect(validateUrlId('Z9bQ7r')).toBe(true);
      expect(validateUrlId('123456')).toBe(true);
      expect(validateUrlId('abcdef')).toBe(true);
      expect(validateUrlId('ABCDEF')).toBe(true);
    });
    
    it('should reject incorrect URL IDs', () => {
      expect(validateUrlId('')).toBe(false);
      expect(validateUrlId('abc')).toBe(false); // Too short
      expect(validateUrlId('abc-123')).toBe(false); // Invalid char
      expect(validateUrlId('abcdefg')).toBe(false); // Too long
      expect(validateUrlId('abc 12')).toBe(false); // Space
    });
    
    it('should respect custom length validation', () => {
      expect(validateUrlId('abc123', 6)).toBe(true);
      expect(validateUrlId('abc123', 7)).toBe(false); // Wrong length
      expect(validateUrlId('abc12345', 8)).toBe(true);
    });
  });
}); 