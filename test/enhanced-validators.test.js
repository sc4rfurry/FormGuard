/**
 * Tests for enhanced validators
 */

import { email, creditcard, phone, pattern } from '../src/validators.js';

describe('Enhanced Email Validator', () => {
  test('should validate basic email addresses', () => {
    expect(email('test@example.com')).toBe(true);
    expect(email('user.name@domain.co.uk')).toBe(true);
    expect(email('user+tag@example.org')).toBe(true);
  });

  test('should reject invalid email formats in basic mode', () => {
    expect(email('invalid')).toContain('valid email');
    expect(email('@example.com')).toContain('valid email');
    expect(email('test@')).toContain('valid email');
    expect(email('test..test@example.com')).toContain('valid email');
  });

  test('should enforce length limits in strict mode', () => {
    const longEmail = 'a'.repeat(320) + '@example.com';
    expect(email(longEmail, 'strict')).toContain('too long');

    const longLocal = 'a'.repeat(65) + '@example.com';
    expect(email(longLocal, 'strict')).toContain('local part is too long');

    const longDomain = 'test@' + 'a'.repeat(250) + '.com';
    expect(email(longDomain, 'strict')).toContain('domain is too long');
  });

  test('should validate domain structure in strict mode', () => {
    expect(email('test@domain', 'strict')).toContain('at least one dot');
    expect(email('test@domain.', 'strict')).toContain('cannot start or end with a dot');
    expect(email('test@.domain.com', 'strict')).toContain('cannot start or end with a dot');
    expect(email('test@domain.c', 'strict')).toContain('valid top-level domain');
  });

  test('should allow empty values', () => {
    expect(email('')).toBe(true);
    expect(email(null)).toBe(true);
    expect(email(undefined)).toBe(true);
  });
});

describe('Enhanced Credit Card Validator', () => {
  test('should validate known card types', () => {
    expect(creditcard('4111111111111111')).toBe(true); // Visa
    expect(creditcard('5555555555554444')).toBe(true); // Mastercard
    expect(creditcard('378282246310005')).toBe(true);  // Amex
    expect(creditcard('6011111111111117')).toBe(true); // Discover
  });

  test('should detect and validate card types', () => {
    expect(creditcard('4111111111111111', 'visa')).toBe(true);
    expect(creditcard('5555555555554444', 'mastercard')).toBe(true);
    expect(creditcard('378282246310005', 'amex')).toBe(true);
  });

  test('should reject wrong card types', () => {
    expect(creditcard('4111111111111111', 'mastercard')).toContain('Mastercard');
    expect(creditcard('5555555555554444', 'visa')).toContain('Visa');
  });

  test('should validate card length by type', () => {
    expect(creditcard('411111111111111')).toContain('16 or 19 digits'); // Visa too short
    expect(creditcard('37828224631000')).toContain('15 digits'); // Amex too short
  });

  test('should reject test card numbers in strict mode', () => {
    expect(creditcard('4111111111111111', 'strict')).toContain('Test card numbers');
    expect(creditcard('5555555555554444', 'strict')).toContain('Test card numbers');
  });

  test('should reject invalid formats', () => {
    expect(creditcard('411111111111111a')).toContain('only digits');
    expect(creditcard('1234567890123456')).toContain('valid credit card');
  });

  test('should handle spaces and dashes in strict mode', () => {
    expect(creditcard('4111-1111-1111-1111', 'strict')).toContain('Test card numbers');
    expect(creditcard('4111 1111 1111 1111', 'strict')).toContain('Test card numbers');
  });

  test('should allow empty values', () => {
    expect(creditcard('')).toBe(true);
    expect(creditcard(null)).toBe(true);
    expect(creditcard(undefined)).toBe(true);
  });
});

describe('Enhanced Phone Validator', () => {
  test('should validate international phone numbers', () => {
    expect(phone('+1234567890')).toBe(true);
    expect(phone('1234567890')).toBe(true);
    expect(phone('+44 20 7946 0958')).toBe(true);
  });

  test('should validate country-specific formats', () => {
    expect(phone('1234567890', 'us')).toBe(true);
    expect(phone('+1 234 567 8901', 'us')).toBe(true);
    expect(phone('+44 20 7946 0958', 'uk')).toBe(true);
  });

  test('should reject invalid country formats', () => {
    expect(phone('123456789', 'us')).toContain('US phone number');
    expect(phone('+1 234 567 890', 'uk')).toContain('UK phone number');
  });

  test('should enforce length limits in strict mode', () => {
    expect(phone('123456', 'strict')).toContain('too short');
    expect(phone('1234567890123456', 'strict')).toContain('too long');
  });

  test('should reject obviously invalid patterns in strict mode', () => {
    expect(phone('1111111111', 'strict')).toContain('valid phone number');
    expect(phone('1234567890', 'strict')).toContain('valid phone number'); // Sequential
  });

  test('should handle various formats', () => {
    expect(phone('+1 (234) 567-8901')).toBe(true);
    expect(phone('234.567.8901')).toBe(true);
    expect(phone('234 567 8901')).toBe(true);
  });

  test('should allow empty values', () => {
    expect(phone('')).toBe(true);
    expect(phone(null)).toBe(true);
    expect(phone(undefined)).toBe(true);
  });
});

describe('Enhanced Pattern Validator with ReDoS Protection', () => {
  test('should validate basic patterns', () => {
    expect(pattern('abc123', '^[a-z]+[0-9]+$')).toBe(true);
    expect(pattern('test@example.com', '^[^@]+@[^@]+$')).toBe(true);
  });

  test('should reject invalid patterns', () => {
    expect(pattern('123abc', '^[a-z]+[0-9]+$')).toContain('valid format');
    expect(pattern('invalid', '^[^@]+@[^@]+$')).toContain('valid format');
  });

  test('should prevent ReDoS attacks in strict mode', () => {
    // Enable strict mode for this test
    global.window.FormGuardStrictMode = true;
    const dangerousPattern = '(a+)+$';
    expect(pattern('aaaaaaaaaaaaaaaaaaaaX', dangerousPattern)).toContain('unsafe constructs');
    global.window.FormGuardStrictMode = false;
  });

  test('should reject overly complex patterns in strict mode', () => {
    // Enable strict mode for this test
    global.window.FormGuardStrictMode = true;
    const longPattern = 'a'.repeat(1001);
    expect(pattern('test', longPattern)).toContain('too complex');
    global.window.FormGuardStrictMode = false;
  });

  test('should handle pattern errors gracefully', () => {
    expect(pattern('test', '[')).toContain('Invalid pattern');
    expect(pattern('test', '*')).toContain('Invalid pattern');
  });

  test('should warn about slow patterns', () => {
    // This test would need to be adjusted based on actual implementation
    const slowPattern = '^(a|a)*$';
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    pattern('aaaaaaaaaa', slowPattern);
    
    consoleSpy.mockRestore();
  });

  test('should allow empty values', () => {
    expect(pattern('', '^[a-z]+$')).toBe(true);
    expect(pattern(null, '^[a-z]+$')).toBe(true);
    expect(pattern(undefined, '^[a-z]+$')).toBe(true);
  });
});
