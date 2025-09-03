/**
 * Tests for built-in validators
 */

import {
  required,
  email,
  min,
  max,
  pattern,
  match,
  url,
  number,
  integer,
  date,
  creditcard,
  phone,
  remote,
  unique,
  ValidatorRegistry
} from '../src/validators.js';

describe('Built-in Validators', () => {
  let mockField;
  
  beforeEach(() => {
    mockField = document.createElement('input');
    mockField.type = 'text';
    mockField.name = 'testField';
  });
  
  describe('required validator', () => {
    test('should validate non-empty text input', () => {
      expect(required('test value', null, mockField)).toBe(true);
    });
    
    test('should reject empty text input', () => {
      expect(required('', null, mockField)).toBe('This field is required');
      expect(required('   ', null, mockField)).toBe('This field is required');
    });
    
    test('should validate checked checkbox', () => {
      mockField.type = 'checkbox';
      mockField.checked = true;
      expect(required(true, null, mockField)).toBe(true);
    });
    
    test('should reject unchecked checkbox', () => {
      mockField.type = 'checkbox';
      mockField.checked = false;
      expect(required(false, null, mockField)).toBe('This field is required');
    });
    
    test('should validate file input with files', () => {
      mockField.type = 'file';
      const mockFiles = [{ name: 'test.txt' }];
      expect(required(mockFiles, null, mockField)).toBe(true);
    });
    
    test('should reject file input without files', () => {
      mockField.type = 'file';
      expect(required([], null, mockField)).toBe('Please select a file');
    });
  });
  
  describe('email validator', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'first.last@subdomain.example.com'
      ];
      
      validEmails.forEach(email_addr => {
        expect(email(email_addr)).toBe(true);
      });
    });
    
    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com'
      ];
      
      invalidEmails.forEach(email_addr => {
        expect(email(email_addr)).toBe('Please enter a valid email address');
      });
    });
    
    test('should allow empty value (unless required)', () => {
      expect(email('')).toBe(true);
      expect(email(null)).toBe(true);
      expect(email(undefined)).toBe(true);
    });
  });
  
  describe('min validator', () => {
    test('should validate string length', () => {
      expect(min('hello', '3', mockField)).toBe(true);
      expect(min('hello', '5', mockField)).toBe(true);
      expect(min('hi', '5', mockField)).toBe('Must be at least 5 characters long');
    });
    
    test('should validate numeric values', () => {
      mockField.type = 'number';
      expect(min('10', '5', mockField)).toBe(true);
      expect(min('5', '5', mockField)).toBe(true);
      expect(min('3', '5', mockField)).toBe('Value must be at least 5');
    });
    
    test('should allow empty values', () => {
      expect(min('', '5', mockField)).toBe(true);
    });
  });
  
  describe('max validator', () => {
    test('should validate string length', () => {
      expect(max('hello', '10', mockField)).toBe(true);
      expect(max('hello', '5', mockField)).toBe(true);
      expect(max('hello world', '5', mockField)).toBe('Must be at most 5 characters long');
    });
    
    test('should validate numeric values', () => {
      mockField.type = 'number';
      expect(max('5', '10', mockField)).toBe(true);
      expect(max('10', '10', mockField)).toBe(true);
      expect(max('15', '10', mockField)).toBe('Value must be at most 10');
    });
  });
  
  describe('pattern validator', () => {
    test('should validate against regex pattern', () => {
      expect(pattern('123', '^\\d+$')).toBe(true);
      expect(pattern('abc', '^[a-z]+$')).toBe(true);
      expect(pattern('123abc', '^\\d+$')).toBe('Please enter a valid format');
    });
    
    test('should handle invalid regex patterns', () => {
      expect(pattern('test', '[')).toBe('Invalid pattern configuration');
    });
  });
  
  describe('match validator', () => {
    test('should validate matching fields', () => {
      const form = createTestForm(`
        <input name="password" value="secret123">
        <input name="confirmPassword" value="secret123">
      `);
      
      const confirmField = form.querySelector('[name="confirmPassword"]');
      expect(match('secret123', 'password', confirmField)).toBe(true);
    });
    
    test('should reject non-matching fields', () => {
      const form = createTestForm(`
        <input name="password" value="secret123">
        <input name="confirmPassword" value="different">
      `);
      
      const confirmField = form.querySelector('[name="confirmPassword"]');
      expect(match('different', 'password', confirmField)).toBe('Fields do not match');
    });
  });
  
  describe('url validator', () => {
    test('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.org',
        'https://example.com/path?query=value',
        'ftp://files.example.com'
      ];
      
      validUrls.forEach(url_val => {
        expect(url(url_val)).toBe(true);
      });
    });
    
    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'htp://example.com',
        'example.com'
      ];
      
      invalidUrls.forEach(url_val => {
        expect(url(url_val)).toBe('Please enter a valid URL');
      });
    });
  });
  
  describe('number validator', () => {
    test('should validate numeric values', () => {
      expect(number('123')).toBe(true);
      expect(number('123.45')).toBe(true);
      expect(number('-67.89')).toBe(true);
    });
    
    test('should reject non-numeric values', () => {
      expect(number('abc')).toBe('Please enter a valid number');
      expect(number('12abc')).toBe('Please enter a valid number');
    });
  });
  
  describe('integer validator', () => {
    test('should validate integer values', () => {
      expect(integer('123')).toBe(true);
      expect(integer('-456')).toBe(true);
      expect(integer('0')).toBe(true);
    });
    
    test('should reject decimal values', () => {
      expect(integer('123.45')).toBe('Please enter a valid whole number');
    });
    
    test('should reject non-numeric values', () => {
      expect(integer('abc')).toBe('Please enter a valid whole number');
    });
  });
  
  describe('date validator', () => {
    test('should validate correct date formats', () => {
      expect(date('2023-12-25')).toBe(true);
      expect(date('12/25/2023')).toBe(true);
      expect(date('December 25, 2023')).toBe(true);
    });
    
    test('should reject invalid dates', () => {
      expect(date('invalid-date')).toBe('Please enter a valid date');
      expect(date('2023-13-45')).toBe('Please enter a valid date');
    });
  });
  
  describe('creditcard validator', () => {
    test('should validate correct credit card numbers', () => {
      // Valid test credit card numbers (using Luhn algorithm)
      expect(creditcard('4532015112830366')).toBe(true); // Visa
      expect(creditcard('4532 0151 1283 0366')).toBe(true); // Visa with spaces
      expect(creditcard('4532-0151-1283-0366')).toBe(true); // Visa with hyphens
    });
    
    test('should reject invalid credit card numbers', () => {
      expect(creditcard('1234567890123456')).toBe('Please enter a valid credit card number');
      expect(creditcard('abc')).toBe('Credit card number must contain only digits');
      expect(creditcard('123')).toBe('Credit card number must be between 13 and 19 digits');
    });
  });
  
  describe('phone validator', () => {
    test('should validate phone numbers', () => {
      expect(phone('+1234567890')).toBe(true);
      expect(phone('123-456-7890')).toBe(true);
      expect(phone('(123) 456-7890')).toBe(true);
    });
    
    test('should reject invalid phone numbers', () => {
      expect(phone('123')).toBe('Please enter a valid phone number');
      expect(phone('abc-def-ghij')).toBe('Please enter a valid phone number');
    });
  });
  
  describe('remote validator', () => {
    beforeEach(() => {
      fetch.mockClear();
    });
    
    test('should validate with successful API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true })
      });
      
      const result = await remote('testvalue', '/api/validate', mockField);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/validate?value=testvalue', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    });
    
    test('should handle API validation failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false, message: 'Value already exists' })
      });
      
      const result = await remote('testvalue', '/api/validate', mockField);
      expect(result).toBe('Value already exists');
    });
    
    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await remote('testvalue', '/api/validate', mockField);
      expect(result).toBe(true); // Should not block submission on network errors
    });
  });

  describe('unique validator', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should allow empty values', async () => {
      const result = await unique('', '/api/check-unique', mockField);
      expect(result).toBe(true);
    });

    test('should validate unique values with unique:true response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unique: true })
      });

      const result = await unique('newuser', '/api/check-unique', mockField);
      expect(result).toBe(true);
    });

    test('should reject non-unique values with unique:false response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unique: false, message: 'Username already taken' })
      });

      const result = await unique('existinguser', '/api/check-unique', mockField);
      expect(result).toBe('Username already taken');
    });

    test('should handle available:true response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true })
      });

      const result = await unique('newuser', '/api/check-unique', mockField);
      expect(result).toBe(true);
    });

    test('should handle exists:false response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const result = await unique('newuser', '/api/check-unique', mockField);
      expect(result).toBe(true);
    });

    test('should handle exists:true response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true })
      });

      const result = await unique('existinguser', '/api/check-unique', mockField);
      expect(result).toBe('This value is already taken');
    });

    test('should support POST method with custom field name', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unique: true })
      });

      mockField.name = 'username';
      await unique('testuser', '/api/check-unique|method:POST,field:username', mockField);

      expect(fetch).toHaveBeenCalledWith('/api/check-unique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser' })
      });
    });

    test('should use GET method by default', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unique: true })
      });

      mockField.name = 'email';
      await unique('test@example.com', '/api/check-unique', mockField);

      expect(fetch).toHaveBeenCalledWith('/api/check-unique?email=test%40example.com', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await unique('testuser', '/api/check-unique', mockField);
      expect(result).toBe(true); // Should not block submission on network errors
    });

    test('should handle HTTP errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await unique('testuser', '/api/check-unique', mockField);
      expect(result).toBe(true); // Should not block submission on server errors
    });
  });
});

describe('ValidatorRegistry', () => {
  let registry;
  
  beforeEach(() => {
    registry = new ValidatorRegistry();
  });
  
  test('should register and retrieve validators', () => {
    const customValidator = (value) => value.length > 5;
    registry.register('custom', customValidator);
    
    expect(registry.has('custom')).toBe(true);
    expect(registry.get('custom')).toBe(customValidator);
  });
  
  test('should have built-in validators', () => {
    expect(registry.has('required')).toBe(true);
    expect(registry.has('email')).toBe(true);
    expect(registry.has('min')).toBe(true);
    expect(registry.has('max')).toBe(true);
    expect(registry.has('unique')).toBe(true);
    expect(registry.has('remote')).toBe(true);
  });
  
  test('should remove validators', () => {
    registry.register('temp', () => true);
    expect(registry.has('temp')).toBe(true);
    
    registry.remove('temp');
    expect(registry.has('temp')).toBe(false);
  });
  
  test('should handle caching', () => {
    const key = registry.getCacheKey('email', 'test@example.com', null);
    registry.setCache(key, true);
    
    expect(registry.getFromCache(key)).toBe(true);
  });
  
  test('should clear cache', () => {
    const key = registry.getCacheKey('email', 'test@example.com', null);
    registry.setCache(key, true);
    
    registry.clearCache();
    expect(registry.getFromCache(key)).toBeUndefined();
  });
  
  test('should throw error for invalid validator', () => {
    expect(() => {
      registry.register('invalid', 'not-a-function');
    }).toThrow('Validator "invalid" must be a function');
  });
});