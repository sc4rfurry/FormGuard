/**
 * Built-in validators for FormGuard
 */

import { makeRequest, escapeRegex } from './utils.js';

/**
 * Required field validator
 * @param {*} value - Field value
 * @param {string} params - Validator parameters
 * @param {HTMLElement} field - Form field element
 * @return {boolean|string} True if valid, error message if invalid
 */
export function required(value, params, field) {
  if (field.type === 'checkbox' || field.type === 'radio') {
    return field.checked || 'This field is required';
  }
  
  if (field.type === 'file') {
    return (value && value.length > 0) || 'Please select a file';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 || 'Please select at least one option';
  }
  
  const stringValue = String(value).trim();
  return stringValue.length > 0 || 'This field is required';
}

/**
 * Enhanced email validation with comprehensive checks
 * @param {string} value - Email value
 * @param {string} mode - Validation mode ('strict' for enhanced validation)
 * @return {boolean|string} True if valid, error message if invalid
 */
export function email(value, mode) {
  if (!value) return true; // Allow empty unless required

  // Use enhanced validation in strict mode
  if (mode === 'strict') {
    return emailStrict(value);
  }

  // Basic email validation for backward compatibility
  // More strict basic validation to catch common invalid patterns
  const emailRegex = /^[^\s@.][^\s@]*[^\s@.]@[^\s@.][^\s@]*[^\s@.]\.[^\s@.][^\s@]*[^\s@.]$/;

  // Additional checks for common invalid patterns
  if (value.includes('..') || value.startsWith('.') || value.endsWith('.') ||
      value.startsWith('@') || value.endsWith('@') ||
      !value.includes('@') || value.split('@').length !== 2) {
    return 'Please enter a valid email address';
  }

  return emailRegex.test(value) || 'Please enter a valid email address';
}

/**
 * Strict email validation with comprehensive RFC compliance
 * @param {string} value - Email address to validate
 * @return {boolean|string} True if valid, error message if invalid
 */
function emailStrict(value) {
  // Enhanced length validation
  if (value.length > 320) {
    return 'Email address is too long (maximum 320 characters)';
  }

  // Split email into local and domain parts
  const atIndex = value.lastIndexOf('@');
  if (atIndex === -1) {
    return 'Email must contain an @ symbol';
  }

  const localPart = value.substring(0, atIndex);
  const domainPart = value.substring(atIndex + 1);

  // Validate local part
  if (localPart.length === 0) {
    return 'Email must have a local part before @';
  }

  if (localPart.length > 64) {
    return 'Email local part is too long (maximum 64 characters)';
  }

  // Check for consecutive dots in local part
  if (localPart.includes('..')) {
    return 'Email local part cannot contain consecutive dots';
  }

  // Check for dots at start/end of local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email local part cannot start or end with a dot';
  }

  // Validate domain part
  if (domainPart.length === 0) {
    return 'Email must have a domain part after @';
  }

  if (domainPart.length > 253) {
    return 'Email domain is too long (maximum 253 characters)';
  }

  // Domain must contain at least one dot
  if (!domainPart.includes('.')) {
    return 'Email domain must contain at least one dot';
  }

  // Check for dots at start/end of domain
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return 'Email domain cannot start or end with a dot';
  }

  // Check for consecutive dots in domain
  if (domainPart.includes('..')) {
    return 'Email domain cannot contain consecutive dots';
  }

  // Enhanced regex for RFC compliance
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }

  // Validate TLD (top-level domain)
  const tld = domainPart.split('.').pop();
  if (tld.length < 2) {
    return 'Email must have a valid top-level domain';
  }

  return true;
}

/**
 * Minimum length/value validator
 * @param {string|number} value - Field value
 * @param {string} params - Minimum value
 * @param {HTMLElement} field - Form field element
 * @return {boolean|string} True if valid, error message if invalid
 */
export function min(value, params, field) {
  if (!value && value !== 0) return true; // Allow empty unless required
  
  const minValue = parseFloat(params);
  if (isNaN(minValue)) return 'Invalid minimum value configuration';
  
  if (field.type === 'number' || field.type === 'range') {
    const numValue = parseFloat(value);
    return numValue >= minValue || `Value must be at least ${minValue}`;
  }
  
  // String length validation
  const length = String(value).length;
  return length >= minValue || `Must be at least ${minValue} characters long`;
}

/**
 * Maximum length/value validator
 * @param {string|number} value - Field value
 * @param {string} params - Maximum value
 * @param {HTMLElement} field - Form field element
 * @return {boolean|string} True if valid, error message if invalid
 */
export function max(value, params, field) {
  if (!value && value !== 0) return true; // Allow empty unless required
  
  const maxValue = parseFloat(params);
  if (isNaN(maxValue)) return 'Invalid maximum value configuration';
  
  if (field.type === 'number' || field.type === 'range') {
    const numValue = parseFloat(value);
    return numValue <= maxValue || `Value must be at most ${maxValue}`;
  }
  
  // String length validation
  const length = String(value).length;
  return length <= maxValue || `Must be at most ${maxValue} characters long`;
}

/**
 * Pattern validation (regex) with ReDoS protection
 * @param {string} value - Field value
 * @param {string} params - Regex pattern
 * @return {boolean|string} True if valid, error message if invalid
 */
export function pattern(value, params) {
  if (!value) return true; // Allow empty unless required

  try {
    if (!params || typeof params !== 'string') {
      return 'Invalid pattern configuration';
    }

    // Check for strict mode features
    const isStrictMode = typeof window !== 'undefined' && window.FormGuardStrictMode;

    if (isStrictMode) {
      // Validate regex complexity to prevent ReDoS
      if (params.length > 1000) {
        return 'Pattern is too complex';
      }

      // Check for potentially dangerous patterns that could cause ReDoS
      const dangerousPatterns = [
        /(\*\+|\+\*|\*\*|\+\+)/,  // Nested quantifiers like *+ or ++
        /\([^)]*[+*][^)]*\)[+*]/,  // Nested quantifiers like (a+)+ or (a*)*
        /\(\?\!/,                  // Negative lookahead
        /\(\?\</,                  // Lookbehind
        /\(\?\=/,                  // Positive lookahead
        /\(\?\<\=/,                // Positive lookbehind
        /\(\?\<\!/,                // Negative lookbehind
        /(\([^)]*\)){3,}/,         // Deeply nested groups
        /(\[[^\]]*\]){5,}/,        // Many character classes
      ];

      if (dangerousPatterns.some(pattern => pattern.test(params))) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.warn('FormGuard: Pattern contains potentially unsafe constructs');
        }
        return 'Pattern contains potentially unsafe constructs';
      }
    }

    const regex = new RegExp(params);
    return regex.test(value) || 'Please enter a valid format';
  } catch (error) {
    return 'Invalid pattern configuration';
  }
}

/**
 * Match another field
 * @param {string} value - Field value
 * @param {string} params - Field name to match
 * @param {HTMLElement} field - Form field element
 * @return {boolean|string} True if valid, error message if invalid
 */
export function match(value, params, field) {
  const form = field.closest('form');
  if (!form) return 'Cannot find form to match field';
  
  const matchField = form.querySelector(`[name="${params}"]`);
  if (!matchField) return `Cannot find field "${params}" to match`;
  
  const matchValue = matchField.value;
  return value === matchValue || 'Fields do not match';
}

/**
 * URL validation
 * @param {string} value - URL value
 * @return {boolean|string} True if valid, error message if invalid
 */
export function url(value) {
  if (!value) return true; // Allow empty unless required

  // Check for basic URL structure first
  if (!value.includes('://')) {
    return 'Please enter a valid URL';
  }

  try {
    const urlObj = new URL(value);
    // Ensure it has a valid protocol (scheme) and host
    if (!urlObj.protocol || urlObj.protocol === ':' || !urlObj.host) {
      return 'Please enter a valid URL';
    }

    // Check for common valid protocols
    const validProtocols = ['http:', 'https:', 'ftp:', 'ftps:', 'file:', 'mailto:'];
    if (!validProtocols.includes(urlObj.protocol)) {
      return 'Please enter a valid URL';
    }

    return true;
  } catch (e) {
    return 'Please enter a valid URL';
  }
}

/**
 * Number validation
 * @param {string} value - Number value
 * @return {boolean|string} True if valid, error message if invalid
 */
export function number(value) {
  if (!value) return true; // Allow empty unless required

  // More strict validation - ensure the entire string is a valid number
  const trimmedValue = String(value).trim();
  const numValue = Number(trimmedValue);

  // Check if the conversion is valid and the string represents a complete number
  return (!isNaN(numValue) && isFinite(numValue) && trimmedValue !== '' &&
          String(numValue) === trimmedValue) || 'Please enter a valid number';
}

/**
 * Integer validation
 * @param {string} value - Integer value
 * @return {boolean|string} True if valid, error message if invalid
 */
export function integer(value) {
  if (!value) return true; // Allow empty unless required
  
  const numValue = parseInt(value, 10);
  return !isNaN(numValue) && String(numValue) === String(value).trim() || 'Please enter a valid whole number';
}

/**
 * Date validation
 * @param {string} value - Date value
 * @return {boolean|string} True if valid, error message if invalid
 */
export function date(value) {
  if (!value) return true; // Allow empty unless required
  
  const dateValue = new Date(value);
  return !isNaN(dateValue.getTime()) || 'Please enter a valid date';
}

/**
 * Enhanced credit card validation with card type detection and issuer-specific validation
 * @param {string} value - Credit card number
 * @param {string} params - Optional card type restriction (visa, mastercard, amex, etc.)
 * @return {boolean|string} True if valid, error message if invalid
 */
export function creditcard(value, params) {
  if (!value) return true; // Allow empty unless required

  // Remove spaces and dashes
  const cardNumber = value.replace(/[\s-]/g, '');

  // Check if all digits
  if (!/^\d+$/.test(cardNumber)) {
    return 'Credit card number must contain only digits';
  }

  // Check general length requirements
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return 'Credit card number must be between 13 and 19 digits';
  }

  // Enhanced card type detection with issuer-specific validation
  const cardTypes = {
    visa: {
      pattern: /^4/,
      lengths: [13, 16, 19],
      name: 'Visa'
    },
    mastercard: {
      pattern: /^5[1-5]|^2[2-7]/,
      lengths: [16],
      name: 'Mastercard'
    },
    amex: {
      pattern: /^3[47]/,
      lengths: [15],
      name: 'American Express'
    },
    discover: {
      pattern: /^6(?:011|5)/,
      lengths: [16],
      name: 'Discover'
    },
    diners: {
      pattern: /^3[0689]/,
      lengths: [14],
      name: 'Diners Club'
    },
    jcb: {
      pattern: /^35/,
      lengths: [16],
      name: 'JCB'
    },
    unionpay: {
      pattern: /^62/,
      lengths: [16, 17, 18, 19],
      name: 'UnionPay'
    }
  };

  // Detect card type and validate
  let detectedCardType = null;
  let validType = false;

  for (const [type, config] of Object.entries(cardTypes)) {
    if (config.pattern.test(cardNumber)) {
      detectedCardType = type;
      if (config.lengths.includes(cardNumber.length)) {
        validType = true;
        break;
      }
    }
  }

  // If specific card type is required, check it matches
  if (params && params.toLowerCase() !== detectedCardType) {
    const requiredType = cardTypes[params.toLowerCase()];
    if (requiredType) {
      return `Please enter a valid ${requiredType.name} card number`;
    }
  }

  if (!validType) {
    if (detectedCardType) {
      const cardConfig = cardTypes[detectedCardType];
      const expectedLengths = cardConfig.lengths.join(' or ');
      return `${cardConfig.name} card numbers must be ${expectedLengths} digits long`;
    } else {
      return 'Please enter a valid credit card number';
    }
  }

  // Enhanced Luhn algorithm with better error handling
  if (!validateLuhn(cardNumber)) {
    if (detectedCardType) {
      return `Please enter a valid ${cardTypes[detectedCardType].name} card number`;
    }
    return 'Please enter a valid credit card number';
  }

  // Additional security checks (only when explicitly enabled)
  if (params === 'strict' && isTestCardNumber(cardNumber)) {
    return 'Test card numbers are not allowed';
  }

  return true;
}

/**
 * Validate using Luhn algorithm
 * @param {string} cardNumber - Card number string
 * @return {boolean} True if valid
 */
function validateLuhn(cardNumber) {
  let sum = 0;
  let shouldDouble = false;

  // Loop through digits from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

    if (isNaN(digit)) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (sum % 10) === 0;
}

/**
 * Check if card number is a known test number
 * @param {string} cardNumber - Card number string
 * @return {boolean} True if test card
 */
function isTestCardNumber(cardNumber) {
  // Common test card numbers (Stripe, PayPal, etc.)
  const testNumbers = [
    '4111111111111111', // Visa
    '4000000000000002', // Visa
    '5555555555554444', // Mastercard
    '5200828282828210', // Mastercard
    '378282246310005',  // Amex
    '371449635398431',  // Amex
    '6011111111111117', // Discover
    '30569309025904',   // Diners
  ];

  return testNumbers.includes(cardNumber);
}

/**
 * Enhanced phone number validation with country-specific patterns
 * @param {string} value - Phone number
 * @param {string} params - Optional country code (us, uk, ca, etc.) or 'international'
 * @return {boolean|string} True if valid, error message if invalid
 */
export function phone(value, params) {
  if (!value) return true; // Allow empty unless required

  // Remove all non-digit characters except +
  const cleanNumber = value.replace(/[^\d+]/g, '');

  // Enhanced phone validation with country support
  const phonePatterns = {
    international: {
      pattern: /^\+?[\d]{7,15}$/,
      name: 'international'
    },
    us: {
      pattern: /^\+?1?[\d]{10}$/,
      name: 'US'
    },
    uk: {
      pattern: /^\+?44[\d]{10}$/,
      name: 'UK'
    },
    ca: {
      pattern: /^\+?1[\d]{10}$/,
      name: 'Canadian'
    },
    au: {
      pattern: /^\+?61[\d]{9}$/,
      name: 'Australian'
    },
    de: {
      pattern: /^\+?49[\d]{10,11}$/,
      name: 'German'
    },
    fr: {
      pattern: /^\+?33[\d]{9}$/,
      name: 'French'
    },
    es: {
      pattern: /^\+?34[\d]{9}$/,
      name: 'Spanish'
    },
    it: {
      pattern: /^\+?39[\d]{9,10}$/,
      name: 'Italian'
    },
    jp: {
      pattern: /^\+?81[\d]{10,11}$/,
      name: 'Japanese'
    },
    cn: {
      pattern: /^\+?86[\d]{11}$/,
      name: 'Chinese'
    },
    in: {
      pattern: /^\+?91[\d]{10}$/,
      name: 'Indian'
    },
    br: {
      pattern: /^\+?55[\d]{10,11}$/,
      name: 'Brazilian'
    },
    mx: {
      pattern: /^\+?52[\d]{10}$/,
      name: 'Mexican'
    }
  };

  // Additional validation for common issues (only in strict mode) - check first
  if (params === 'strict') {
    if (cleanNumber.replace(/^\+/, '').length < 7) {
      return 'Phone number is too short';
    }

    if (cleanNumber.replace(/^\+/, '').length > 15) {
      return 'Phone number is too long';
    }
  }

  // If params specify a country, use country-specific validation
  if (params && params !== 'strict' && phonePatterns[params.toLowerCase()]) {
    const countryPattern = phonePatterns[params.toLowerCase()];
    if (!countryPattern.pattern.test(cleanNumber)) {
      return `Please enter a valid ${countryPattern.name} phone number`;
    }
  } else if (params !== 'strict') {
    // Default international validation with enhanced checks (skip for strict mode)
    if (!phonePatterns.international.pattern.test(cleanNumber)) {
      return 'Please enter a valid phone number';
    }
  }

  // Check for obviously invalid patterns (only if strict mode)
  if (params === 'strict') {
    const digitsOnly = cleanNumber.replace(/^\+/, '');

    // All same digit (like 1111111111)
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return 'Please enter a valid phone number';
    }

    // Sequential digits (like 1234567890)
    if (isSequentialDigits(digitsOnly)) {
      return 'Please enter a valid phone number';
    }
  }

  return true;
}

/**
 * Check if digits are sequential
 * @param {string} digits - Digit string
 * @return {boolean} True if sequential
 */
function isSequentialDigits(digits) {
  if (digits.length < 4) return false;

  for (let i = 0; i < digits.length - 3; i++) {
    const sequence = digits.substring(i, i + 4);
    let isSequential = true;

    for (let j = 1; j < sequence.length; j++) {
      if (parseInt(sequence[j]) !== parseInt(sequence[j-1]) + 1) {
        isSequential = false;
        break;
      }
    }

    if (isSequential) return true;
  }

  return false;
}

/**
 * Remote validation via API endpoint
 * @param {string} value - Field value
 * @param {string} params - API endpoint URL
 * @param {HTMLElement} field - Form field element
 * @return {Promise<boolean|string>} Promise resolving to validation result
 */
export async function remote(value, params, field) {
  if (!value) return true; // Allow empty unless required

  try {
    const url = params.includes('?')
      ? `${params}&value=${encodeURIComponent(value)}`
      : `${params}?value=${encodeURIComponent(value)}`;

    const response = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Expect { valid: boolean, message?: string }
    if (typeof data.valid === 'boolean') {
      return data.valid || (data.message || 'Invalid value');
    }

    // Fallback: if response is truthy, consider valid
    return Boolean(data) || 'Invalid value';

  } catch (error) {
    // Network errors should not block form submission
    // Log error in development mode only
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('FormGuard: Remote validation failed:', error);
    }
    return true;
  }
}

/**
 * Unique validation via API endpoint
 * Checks if a value is unique (e.g., username, email availability)
 * @param {string} value - Field value to check
 * @param {string} params - API endpoint URL or configuration
 * @param {HTMLElement} field - Form field element
 * @return {Promise<boolean|string>} Promise resolving to validation result
 */
export async function unique(value, params, field) {
  if (!value) return true; // Allow empty unless required

  try {
    // Parse params - can be just URL or URL with options
    let url, options = {};

    if (params.includes('|')) {
      const [baseUrl, optionsStr] = params.split('|');
      url = baseUrl;

      // Parse options like "method:POST,field:username"
      optionsStr.split(',').forEach(opt => {
        const [key, val] = opt.split(':');
        if (key && val) {
          options[key.trim()] = val.trim();
        }
      });
    } else {
      url = params;
    }

    // Build request URL/body based on method
    const method = options.method || 'GET';
    const fieldName = options.field || field.name || 'value';

    let requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (method.toUpperCase() === 'GET') {
      // Add value as query parameter
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${fieldName}=${encodeURIComponent(value)}`;
    } else {
      // Add value in request body
      requestOptions.body = JSON.stringify({
        [fieldName]: value
      });
    }

    const response = await makeRequest(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (typeof data.unique === 'boolean') {
      return data.unique || (data.message || 'This value is already taken');
    }

    if (typeof data.available === 'boolean') {
      return data.available || (data.message || 'This value is already taken');
    }

    if (typeof data.valid === 'boolean') {
      return data.valid || (data.message || 'This value is already taken');
    }

    // If response has exists property, invert it
    if (typeof data.exists === 'boolean') {
      return !data.exists || (data.message || 'This value is already taken');
    }

    // Fallback: if response is falsy, consider unique (available)
    return !Boolean(data) || 'This value is already taken';

  } catch (error) {
    // Network errors should not block form submission
    // Log error in development mode only
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('FormGuard: Unique validation failed:', error);
    }
    return true;
  }
}

/**
 * ValidatorRegistry class for managing validators
 */
export class ValidatorRegistry {
  constructor() {
    this.validators = new Map();
    this.cache = new Map();
    this.loadBuiltInValidators();
  }
  
  /**
   * Load built-in validators
   */
  loadBuiltInValidators() {
    const builtInValidators = {
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
      unique
    };

    Object.entries(builtInValidators).forEach(([name, validator]) => {
      this.register(name, validator);
    });
  }
  
  /**
   * Register a validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  register(name, validator) {
    if (typeof validator !== 'function') {
      throw new Error(`Validator "${name}" must be a function`);
    }
    
    this.validators.set(name, validator);
  }
  
  /**
   * Get a validator by name
   * @param {string} name - Validator name
   * @return {Function|null} Validator function or null
   */
  get(name) {
    return this.validators.get(name) || null;
  }
  
  /**
   * Check if validator exists
   * @param {string} name - Validator name
   * @return {boolean} True if validator exists
   */
  has(name) {
    return this.validators.has(name);
  }
  
  /**
   * Remove a validator
   * @param {string} name - Validator name
   * @return {boolean} True if validator was removed
   */
  remove(name) {
    return this.validators.delete(name);
  }
  
  /**
   * Get cache key for async validator
   * @param {string} validatorName - Validator name
   * @param {string} value - Field value
   * @param {string} params - Validator parameters
   * @return {string} Cache key
   */
  getCacheKey(validatorName, value, params) {
    return `${validatorName}:${value}:${params || ''}`;
  }
  
  /**
   * Get cached validation result
   * @param {string} key - Cache key
   * @return {*} Cached result or undefined
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      return cached.result;
    }
    this.cache.delete(key);
    return undefined;
  }
  
  /**
   * Set cached validation result
   * @param {string} key - Cache key
   * @param {*} result - Validation result
   */
  setCache(key, result) {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear();
  }
}