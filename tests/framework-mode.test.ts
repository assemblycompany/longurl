import { generateUrlId, validateUrlId } from '../src/generator';
import { createEntitySlug, isValidUrlId } from '../utils';
import { StorageStrategy, DEFAULT_DB_CONFIG } from '../types';
import * as collision from '../src/collision';

// Mock the collision module
jest.mock('../src/collision', () => ({
  checkCollision: jest.fn()
}));

describe('Framework Mode (URL Management)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('Entity Slug Creation', () => {
    it('should create URL-safe slugs from entity IDs', () => {
      expect(createEntitySlug('laptop-dell-xps-13')).toBe('laptop-dell-xps-13');
      expect(createEntitySlug('USER_123')).toBe('user-123');
      expect(createEntitySlug('Product Name With Spaces!')).toBe('product-name-with-spaces');
      expect(createEntitySlug('article@2024')).toBe('article-2024');
      expect(createEntitySlug('order#12345')).toBe('order-12345');
      expect(createEntitySlug('user.email@domain.com')).toBe('user-email-domain-com');
    });

    it('should handle edge cases in slug creation', () => {
      expect(createEntitySlug('---multiple---dashes---')).toBe('multiple-dashes');
      expect(createEntitySlug('123-numeric-start')).toBe('123-numeric-start');
      expect(createEntitySlug('UPPERCASE')).toBe('uppercase');
      expect(createEntitySlug('special!@#$%^&*()chars')).toBe('special-chars');
    });
  });

  describe('Framework Mode URL Generation', () => {
    it('should generate readable URLs in framework mode', async () => {
      // Mock no collision
      (collision.checkCollision as jest.Mock).mockResolvedValue(false);
      
      const result = await generateUrlId(
        'product',
        'laptop-dell-xps-13',
        { 
          enableShortening: false,
          domain: 'mystore.co'
        }
      );
      
      expect(result.success).toBe(true);
      expect(result.urlId).toBe('laptop-dell-xps-13');
      expect(result.shortUrl).toBe('https://mystore.co/product/laptop-dell-xps-13');
      
      // Verify collision check was called with the entity slug
      expect(collision.checkCollision).toHaveBeenCalledWith(
        'product',
        'laptop-dell-xps-13',
        DEFAULT_DB_CONFIG
      );
    });

    it('should handle entity ID conflicts in framework mode', async () => {
      // Mock collision detected
      (collision.checkCollision as jest.Mock).mockResolvedValue(true);
      
      const result = await generateUrlId(
        'product',
        'laptop-dell-xps-13',
        { enableShortening: false }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('conflicts with existing URL');
      expect(result.error).toContain('laptop-dell-xps-13');
      expect(result.error).toContain('product');
    });

    it('should work gracefully when database is not configured', async () => {
      // Mock database error
      (collision.checkCollision as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );
      
      const result = await generateUrlId(
        'product',
        'laptop-dell-xps-13',
        { enableShortening: false }
      );
      
      // Should succeed despite database error (graceful degradation)
      expect(result.success).toBe(true);
      expect(result.urlId).toBe('laptop-dell-xps-13');
      expect(result.shortUrl).toContain('laptop-dell-xps-13');
    });

    it('should create slugs for complex entity IDs', async () => {
      (collision.checkCollision as jest.Mock).mockResolvedValue(false);
      
      const testCases = [
        { input: 'User Name With Spaces', expected: 'user-name-with-spaces' },
        { input: 'order#12345', expected: 'order-12345' },
        { input: 'article@2024', expected: 'article-2024' },
        { input: 'user.email@domain.com', expected: 'user-email-domain-com' }
      ];
      
      for (const testCase of testCases) {
        const result = await generateUrlId(
          'test',
          testCase.input,
          { enableShortening: false }
        );
        
        expect(result.success).toBe(true);
        expect(result.urlId).toBe(testCase.expected);
        expect(result.shortUrl).toContain(testCase.expected);
      }
    });
  });

  describe('Shortening Mode vs Framework Mode', () => {
    it('should generate different URL formats for each mode', async () => {
      (collision.checkCollision as jest.Mock).mockResolvedValue(false);
      
      const entityType = 'product';
      const entityId = 'laptop-dell-xps-13';
      
      // Shortening mode (default)
      const shortenResult = await generateUrlId(
        entityType,
        entityId,
        { enableShortening: true }
      );
      
      // Framework mode
      const frameworkResult = await generateUrlId(
        entityType,
        entityId,
        { enableShortening: false }
      );
      
      expect(shortenResult.success).toBe(true);
      expect(frameworkResult.success).toBe(true);
      
      // Shortening mode creates random Base62 ID
      expect(shortenResult.urlId).toMatch(/^[a-zA-Z0-9]{6}$/);
      expect(shortenResult.urlId).not.toBe(entityId);
      
      // Framework mode uses entity ID directly
      expect(frameworkResult.urlId).toBe('laptop-dell-xps-13');
      
      // Both should contain entity type in URL path
      expect(shortenResult.shortUrl).toContain('/product/');
      expect(frameworkResult.shortUrl).toContain('/product/');
    });
  });

  describe('URL ID Validation in Framework Mode', () => {
    it('should validate framework mode URLs correctly', () => {
      // Framework mode should accept readable slugs
      expect(isValidUrlId('laptop-dell-xps-13', 6, true)).toBe(true);
      expect(isValidUrlId('user-123', 6, true)).toBe(true);
      expect(isValidUrlId('article-2024', 6, true)).toBe(true);
      
      // Framework mode should reject invalid characters
      expect(isValidUrlId('invalid spaces', 6, true)).toBe(false);
      expect(isValidUrlId('invalid@email', 6, true)).toBe(false);
      expect(isValidUrlId('invalid#hash', 6, true)).toBe(false);
      
      // Framework mode should have reasonable length limits
      expect(isValidUrlId('a'.repeat(100), 6, true)).toBe(true);
      expect(isValidUrlId('a'.repeat(101), 6, true)).toBe(false);
    });

    it('should maintain strict validation for shortening mode', () => {
      // Shortening mode should require exact Base62 format
      expect(isValidUrlId('ABC123', 6, false)).toBe(true);
      expect(isValidUrlId('abc123', 6, false)).toBe(true);
      expect(isValidUrlId('A1B2C3', 6, false)).toBe(true);
      
      // Shortening mode should reject non-Base62 or wrong length
      expect(isValidUrlId('ABC12', 6, false)).toBe(false);  // Too short
      expect(isValidUrlId('ABC1234', 6, false)).toBe(false); // Too long
      expect(isValidUrlId('ABC-12', 6, false)).toBe(false);  // Invalid char
    });
  });

  describe('validateUrlId function wrapper', () => {
    it('should pass through framework mode parameter correctly', () => {
      // Test shortening mode
      expect(validateUrlId('ABC123', 6, false)).toBe(true);
      expect(validateUrlId('ABC-12', 6, false)).toBe(false);
      
      // Test framework mode
      expect(validateUrlId('laptop-dell-xps-13', 6, true)).toBe(true);
      expect(validateUrlId('invalid spaces', 6, true)).toBe(false);
    });
  });
}); 