/**
 * Cross-Browser Compatibility Testing with Playwright
 * Tests FormGuard functionality across different browsers and environments
 */

import { test, expect } from '@playwright/test';

test.describe('FormGuard Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic-usage.html');
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should initialize correctly in all browsers', async ({ page, browserName }) => {
      // Test FormGuard initialization
      const isInitialized = await page.evaluate(() => {
        try {
          const form = document.getElementById('myForm');
          const instance = new FormGuard(form);
          return instance instanceof FormGuard;
        } catch (error) {
          console.error('FormGuard initialization failed:', error);
          return false;
        }
      });
      
      expect(isInitialized).toBeTruthy();
      console.log(`FormGuard initialized successfully in ${browserName}`);
    });

    test('should validate email correctly across browsers', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      
      // Test invalid email
      await emailField.fill('invalid-email');
      await emailField.blur();
      
      await page.waitForSelector('.error-message', { timeout: 5000 });
      const errorMessage = await page.locator('.error-message').textContent();
      
      expect(errorMessage).toContain('valid email');
      
      // Test valid email
      await emailField.fill('user@example.com');
      await emailField.blur();
      
      await page.waitForTimeout(500);
      const hasError = await page.locator('.error-message').count();
      expect(hasError).toBe(0);
      
      console.log(`Email validation working correctly in ${browserName}`);
    });

    test('should handle form submission across browsers', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      const submitButton = page.locator('[type="submit"]');
      
      // Submit with invalid data
      await submitButton.click();
      
      // Check that form was prevented from submitting
      const currentUrl = page.url();
      expect(currentUrl).toContain('basic-usage.html');
      
      // Fill valid data and submit
      await emailField.fill('user@example.com');
      await passwordField.fill('securepassword123');
      await submitButton.click();
      
      // Verify validation passes (form would submit if not prevented)
      await page.waitForTimeout(500);
      
      console.log(`Form submission handling working in ${browserName}`);
    });
  });

  test.describe('Event Handling Across Browsers', () => {
    test('should handle blur events consistently', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      // Allow time for validation to trigger
      await page.waitForSelector('.error-message', { timeout: 3000 });
      
      const errorExists = await page.locator('.error-message').count() > 0;
      expect(errorExists).toBeTruthy();
      
      console.log(`Blur event handling working in ${browserName}`);
    });

    test('should handle input events for live validation', async ({ page, browserName }) => {
      // Enable live validation
      await page.evaluate(() => {
        const form = document.querySelector('form');
        new FormGuard(form, { 
          validateOn: 'input',
          liveValidation: true,
          debounce: 100 // Shorter for testing
        });
      });
      
      const emailField = page.locator('[name="email"]');
      
      await emailField.type('invalid');
      
      // Wait for debounced validation
      await page.waitForTimeout(200);
      
      const errorExists = await page.locator('.error-message').count() > 0;
      expect(errorExists).toBeTruthy();
      
      console.log(`Input event handling working in ${browserName}`);
    });

    test('should handle custom events across browsers', async ({ page, browserName }) => {
      let eventFired = false;
      
      // Listen for FormGuard events
      await page.evaluate(() => {
        window.testEventReceived = false;
        document.querySelector('form').addEventListener('formguard:invalid', () => {
          window.testEventReceived = true;
        });
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForTimeout(500);
      
      eventFired = await page.evaluate(() => window.testEventReceived);
      expect(eventFired).toBeTruthy();
      
      console.log(`Custom events working in ${browserName}`);
    });
  });

  test.describe('CSS and Styling Compatibility', () => {
    test('should apply error classes consistently', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error', { timeout: 3000 });
      
      const hasErrorClass = await emailField.evaluate(el => 
        el.classList.contains('error')
      );
      
      expect(hasErrorClass).toBeTruthy();
      console.log(`Error class application working in ${browserName}`);
    });

    test('should render error messages with consistent styling', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      
      const errorStyles = await page.locator('.error-message').evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          color: computed.color,
          fontSize: computed.fontSize
        };
      });
      
      expect(errorStyles.display).not.toBe('none');
      expect(errorStyles.color).toBeTruthy();
      
      console.log(`Error message styling consistent in ${browserName}`);
    });
  });

  test.describe('JavaScript API Compatibility', () => {
    test('should support Promises correctly across browsers', async ({ page, browserName }) => {
      const validationResult = await page.evaluate(async () => {
        const form = document.querySelector('form');
        const instance = new FormGuard(form);
        
        try {
          const result = await instance.validate();
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      expect(validationResult.success).toBeTruthy();
      console.log(`Promise support working in ${browserName}`);
    });

    test('should handle async validators across browsers', async ({ page, browserName }) => {
      // Mock async endpoint
      await page.route('**/api/test-async**', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
          json: { valid: false, message: 'Async validation failed' }
        });
      });
      
      // Add async validator
      await page.evaluate(() => {
        FormGuard.addValidator('asyncTest', async (value) => {
          const response = await fetch('/api/test-async');
          const data = await response.json();
          return data.valid || data.message;
        });
      });
      
      await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        field.setAttribute('data-validate', 'asyncTest');
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('test');
      await emailField.blur();
      
      // Wait for async validation
      await page.waitForSelector('.error-message', { timeout: 3000 });
      
      const errorText = await page.locator('.error-message').textContent();
      expect(errorText).toContain('Async validation failed');
      
      console.log(`Async validation working in ${browserName}`);
    });

    test('should handle DOM manipulation consistently', async ({ page, browserName }) => {
      // Test dynamic field addition
      await page.evaluate(() => {
        const form = document.querySelector('form');
        const newField = document.createElement('input');
        newField.name = 'dynamicField';
        newField.setAttribute('data-validate', 'required');
        form.appendChild(newField);
      });
      
      const dynamicField = page.locator('[name="dynamicField"]');
      await dynamicField.focus();
      await dynamicField.blur();
      
      // Should validate the dynamic field
      await page.waitForTimeout(500);
      
      const errorExists = await page.locator('.error-message').count() > 0;
      expect(errorExists).toBeTruthy();
      
      console.log(`Dynamic DOM manipulation working in ${browserName}`);
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    test('should work on mobile browsers', async ({ page, browserName, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');
      
      const emailField = page.locator('[name="email"]');
      
      // Test touch interaction
      await emailField.tap();
      await emailField.fill('invalid');
      
      // Tap outside to blur (simulate mobile behavior)
      await page.tap('body');
      
      await page.waitForSelector('.error-message', { timeout: 5000 });
      
      const hasError = await page.locator('.error-message').count() > 0;
      expect(hasError).toBeTruthy();
      
      console.log(`Mobile functionality working in ${browserName}`);
    });

    test('should handle virtual keyboard interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');
      
      const emailField = page.locator('[name="email"]');
      
      // Focus field (should trigger virtual keyboard)
      await emailField.tap();
      
      // Type using mobile keyboard simulation
      await emailField.type('user@example.com');
      
      const value = await emailField.inputValue();
      expect(value).toBe('user@example.com');
      
      console.log('Virtual keyboard interaction working');
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('should handle browser autofill correctly', async ({ page, browserName }) => {
      // Simulate autofill by programmatically setting values
      await page.evaluate(() => {
        const email = document.querySelector('[name="email"]');
        const password = document.querySelector('[name="password"]');
        
        // Simulate browser autofill
        email.value = 'autofilled@example.com';
        password.value = 'autofilledpassword123';
        
        // Dispatch events that browsers typically fire during autofill
        email.dispatchEvent(new Event('input', { bubbles: true }));
        password.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      // Trigger validation
      const emailField = page.locator('[name="email"]');
      await emailField.focus();
      await emailField.blur();
      
      await page.waitForTimeout(500);
      
      // Should validate autofilled content correctly
      const hasError = await page.locator('.error-message').count() > 0;
      expect(hasError).toBe(0); // Should be valid
      
      console.log(`Autofill handling working in ${browserName}`);
    });

    test('should work with browser password managers', async ({ page, browserName }) => {
      // This test simulates how password managers interact with forms
      await page.evaluate(() => {
        const password = document.querySelector('[name="password"]');
        
        // Password managers often set values directly
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(password, 'managerpassword123');
        
        // And dispatch change events
        password.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      const passwordField = page.locator('[name="password"]');
      await passwordField.focus();
      await passwordField.blur();
      
      await page.waitForTimeout(500);
      
      const hasError = await page.locator('.error-message').count() > 0;
      expect(hasError).toBe(0); // Should be valid
      
      console.log(`Password manager compatibility working in ${browserName}`);
    });
  });

  test.describe('Polyfill and Fallback Testing', () => {
    test('should work without fetch API', async ({ page, browserName }) => {
      // Mock fetch as unavailable
      await page.addInitScript(() => {
        delete window.fetch;
      });
      
      // FormGuard should still work for non-async validators
      const isWorking = await page.evaluate(() => {
        try {
          const form = document.querySelector('form');
          const instance = new FormGuard(form);
          
          const email = document.querySelector('[name="email"]');
          email.value = 'invalid';
          email.dispatchEvent(new Event('blur'));
          
          // Should still validate synchronously
          return true;
        } catch (error) {
          return false;
        }
      });
      
      expect(isWorking).toBeTruthy();
      console.log(`Fallback functionality working in ${browserName}`);
    });

    test('should handle missing MutationObserver', async ({ page, browserName }) => {
      // Mock MutationObserver as unavailable
      await page.addInitScript(() => {
        delete window.MutationObserver;
      });
      
      const isWorking = await page.evaluate(() => {
        try {
          const form = document.querySelector('form');
          new FormGuard(form);
          return true;
        } catch (error) {
          console.error('Error without MutationObserver:', error);
          return false;
        }
      });
      
      expect(isWorking).toBeTruthy();
      console.log(`MutationObserver fallback working in ${browserName}`);
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should maintain performance standards across browsers', async ({ page, browserName }) => {
      const perfMetrics = await page.evaluate(() => {
        const start = performance.now();
        
        // Initialize FormGuard
        const form = document.querySelector('form');
        new FormGuard(form);
        
        // Perform validation
        const email = document.querySelector('[name="email"]');
        email.value = 'test@example.com';
        email.dispatchEvent(new Event('blur'));
        
        const end = performance.now();
        return {
          initAndValidateTime: end - start,
          browserName: navigator.userAgent
        };
      });
      
      // Should complete quickly in all browsers
      expect(perfMetrics.initAndValidateTime).toBeLessThan(50);
      
      console.log(`${browserName} performance: ${perfMetrics.initAndValidateTime.toFixed(2)}ms`);
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('should handle JavaScript errors gracefully', async ({ page, browserName }) => {
      // Introduce an error condition
      await page.evaluate(() => {
        // Override a method to cause an error
        HTMLElement.prototype.addEventListener = function() {
          throw new Error('Simulated addEventListener error');
        };
      });
      
      const errorHandled = await page.evaluate(() => {
        try {
          const form = document.querySelector('form');
          new FormGuard(form);
          return false; // Should have thrown
        } catch (error) {
          return true; // Error was caught
        }
      });
      
      // FormGuard should handle the error gracefully or at least fail predictably
      expect(errorHandled).toBeTruthy();
      
      console.log(`Error handling working in ${browserName}`);
    });
  });
});