/**
 * Tests for utility functions
 */

import {
  debounce,
  rafThrottle,
  mergeDeep,
  getNestedValue,
  generateId,
  sanitize,
  isVisible,
  getFieldValue,
  safeFocus,
  parseValidationRules,
  createEvent,
  escapeRegex,
  isHttpSupported,
  makeRequest
} from '../src/utils.js';

describe('Utility Functions', () => {
  describe('debounce', () => {
    jest.useFakeTimers();
    
    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    test('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
  
  describe('rafThrottle', () => {
    test('should throttle function calls with requestAnimationFrame', () => {
      const mockFn = jest.fn();
      const throttledFn = rafThrottle(mockFn);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      // Trigger RAF callbacks
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('mergeDeep', () => {
    test('should merge objects deeply', () => {
      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      };
      
      const source = {
        b: {
          d: 4,
          e: 5
        },
        f: 6
      };
      
      const result = mergeDeep(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 4,
          e: 5
        },
        f: 6
      });
    });
    
    test('should not mutate original objects', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };
      
      const result = mergeDeep(target, source);
      
      expect(target).toEqual({ a: { b: 1 } });
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });
  });
  
  describe('getNestedValue', () => {
    test('should get nested object values', () => {
      const obj = {
        user: {
          profile: {
            name: 'John'
          }
        }
      };
      
      expect(getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(getNestedValue(obj, 'user.profile.age', 'unknown')).toBe('unknown');
      expect(getNestedValue(obj, 'nonexistent.path', 'default')).toBe('default');
    });
  });
  
  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^fg-[a-z0-9]+$/);
    });
    
    test('should use custom prefix', () => {
      const id = generateId('custom');
      expect(id).toMatch(/^custom-[a-z0-9]+$/);
    });
  });
  
  describe('sanitize', () => {
    test('should sanitize HTML content', () => {
      expect(sanitize('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(sanitize('Safe text')).toBe('Safe text');
    });
  });
  
  describe('isVisible', () => {
    test('should detect visible elements', () => {
      const visibleElement = document.createElement('div');
      Object.defineProperty(visibleElement, 'offsetWidth', { value: 100 });
      Object.defineProperty(visibleElement, 'offsetHeight', { value: 50 });
      
      const hiddenElement = document.createElement('div');
      Object.defineProperty(hiddenElement, 'offsetWidth', { value: 0 });
      Object.defineProperty(hiddenElement, 'offsetHeight', { value: 0 });
      
      expect(isVisible(visibleElement)).toBe(true);
      expect(isVisible(hiddenElement)).toBe(false);
    });
  });
  
  describe('getFieldValue', () => {
    test('should get text input value', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'test value';
      
      expect(getFieldValue(input)).toBe('test value');
    });
    
    test('should get checkbox value', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      
      expect(getFieldValue(checkbox)).toBe(true);
    });
    
    test('should get radio button value', () => {
      const form = createTestForm(`
        <input type="radio" name="gender" value="male">
        <input type="radio" name="gender" value="female" checked>
      `);
      
      const radio = form.querySelector('input[name="gender"]:first-child');
      expect(getFieldValue(radio)).toBe('female');
    });
    
    test('should get select multiple values', () => {
      const select = document.createElement('select');
      select.multiple = true;
      
      const option1 = document.createElement('option');
      option1.value = 'option1';
      option1.selected = true;
      
      const option2 = document.createElement('option');
      option2.value = 'option2';
      option2.selected = true;
      
      select.appendChild(option1);
      select.appendChild(option2);
      
      expect(getFieldValue(select)).toEqual(['option1', 'option2']);
    });
  });
  
  describe('safeFocus', () => {
    test('should focus visible elements safely', () => {
      const element = document.createElement('input');
      element.focus = jest.fn();
      Object.defineProperty(element, 'offsetWidth', { value: 100 });
      Object.defineProperty(element, 'offsetHeight', { value: 50 });
      
      safeFocus(element);
      expect(element.focus).toHaveBeenCalled();
    });
    
    test('should not focus hidden elements', () => {
      const element = document.createElement('input');
      element.focus = jest.fn();
      Object.defineProperty(element, 'offsetWidth', { value: 0 });
      Object.defineProperty(element, 'offsetHeight', { value: 0 });
      
      safeFocus(element);
      expect(element.focus).not.toHaveBeenCalled();
    });
    
    test('should handle focus errors gracefully', () => {
      const element = document.createElement('input');
      element.focus = jest.fn(() => {
        throw new Error('Focus failed');
      });
      Object.defineProperty(element, 'offsetWidth', { value: 100 });
      Object.defineProperty(element, 'offsetHeight', { value: 50 });
      
      expect(() => safeFocus(element)).not.toThrow();
    });
  });
  
  describe('parseValidationRules', () => {
    test('should parse simple rules', () => {
      const rules = parseValidationRules('required|email');
      expect(rules).toEqual([
        { name: 'required', params: null },
        { name: 'email', params: null }
      ]);
    });
    
    test('should parse rules with parameters', () => {
      const rules = parseValidationRules('required|min:8|max:20');
      expect(rules).toEqual([
        { name: 'required', params: null },
        { name: 'min', params: '8' },
        { name: 'max', params: '20' }
      ]);
    });
    
    test('should handle complex parameters', () => {
      const rules = parseValidationRules('pattern:[A-Za-z0-9]+|match:password');
      expect(rules).toEqual([
        { name: 'pattern', params: '[A-Za-z0-9]+' },
        { name: 'match', params: 'password' }
      ]);
    });
    
    test('should handle empty or null input', () => {
      expect(parseValidationRules('')).toEqual([]);
      expect(parseValidationRules(null)).toEqual([]);
      expect(parseValidationRules(undefined)).toEqual([]);
    });
  });
  
  describe('createEvent', () => {
    test('should create custom events', () => {
      const event = createEvent('test:event', { data: 'test' });
      
      expect(event.type).toBe('test:event');
      expect(event.detail).toEqual({ data: 'test' });
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
    });
  });
  
  describe('escapeRegex', () => {
    test('should escape regex special characters', () => {
      expect(escapeRegex('.*+?^${}()|[]\\'))
        .toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
      expect(escapeRegex('normal text')).toBe('normal text');
    });
  });
  
  describe('isHttpSupported', () => {
    test('should detect HTTP support', () => {
      // In test environment, fetch should be mocked
      expect(isHttpSupported()).toBe(true);
    });
  });
  
  describe('makeRequest', () => {
    beforeEach(() => {
      fetch.mockClear();
    });
    
    test('should make requests with fetch when available', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const response = await makeRequest('https://api.example.com/test');
      
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {});
      expect(response).toBe(mockResponse);
    });
    
    test('should handle request options', async () => {
      const mockResponse = { ok: true, status: 200 };
      fetch.mockResolvedValueOnce(mockResponse);
      
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      };
      
      await makeRequest('https://api.example.com/test', options);
      
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', options);
    });
  });
});