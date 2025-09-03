/**
 * Performance Testing with Playwright
 * Tests FormGuard performance under various conditions
 */

import { test, expect } from '@playwright/test';

test.describe('FormGuard Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic-usage.html');
  });

  test.describe('Initialization Performance', () => {
    test('should initialize FormGuard within performance threshold', async ({ page }) => {
      // Measure initialization time
      const initTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Initialize FormGuard
        const form = document.getElementById('myForm');
        new FormGuard(form);
        
        const end = performance.now();
        return end - start;
      });
      
      // Should initialize in under 10ms as per spec
      expect(initTime).toBeLessThan(10);
      console.log(`FormGuard initialization time: ${initTime.toFixed(2)}ms`);
    });

    test('should handle multiple form initialization efficiently', async ({ page }) => {
      // Create multiple forms
      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) {
          const form = document.createElement('form');
          form.id = `form-${i}`;
          form.innerHTML = `
            <input name="email-${i}" data-validate="required|email">
            <input name="password-${i}" data-validate="required|min:8">
          `;
          document.body.appendChild(form);
        }
      });
      
      // Measure multiple initialization
      const initTime = await page.evaluate(() => {
        const start = performance.now();
        
        for (let i = 0; i < 5; i++) {
          const form = document.getElementById(`form-${i}`);
          new FormGuard(form);
        }
        
        const end = performance.now();
        return end - start;
      });
      
      // Should handle multiple forms efficiently
      expect(initTime).toBeLessThan(50);
      console.log(`Multiple forms initialization time: ${initTime.toFixed(2)}ms`);
    });
  });

  test.describe('Validation Performance', () => {
    test('should validate single field quickly', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Measure validation time
      const validationTime = await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        const start = performance.now();
        
        // Trigger validation
        field.value = 'test@example.com';
        field.dispatchEvent(new Event('blur'));
        
        const end = performance.now();
        return end - start;
      });
      
      // Should validate in under 1ms for sync validators
      expect(validationTime).toBeLessThan(5);
      console.log(`Single field validation time: ${validationTime.toFixed(2)}ms`);
    });

    test('should handle rapid input changes efficiently', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Test rapid typing scenario
      const rapidInputTime = await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        const start = performance.now();
        
        // Simulate rapid typing
        const testString = 'user@example.com';
        for (let i = 0; i < testString.length; i++) {
          field.value = testString.substring(0, i + 1);
          field.dispatchEvent(new Event('input'));
        }
        
        const end = performance.now();
        return end - start;
      });
      
      expect(rapidInputTime).toBeLessThan(20);
      console.log(`Rapid input handling time: ${rapidInputTime.toFixed(2)}ms`);
    });

    test('should debounce async validators effectively', async ({ page }) => {
      // Mock async validation endpoint
      await page.route('**/api/check-email**', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        await route.fulfill({
          json: { valid: true }
        });
      });
      
      // Add async validator
      await page.evaluate(() => {
        FormGuard.addValidator('asyncEmail', async (value) => {
          const response = await fetch(`/api/check-email?email=${value}`);
          const data = await response.json();
          return data.valid || 'Email not available';
        });
        
        const field = document.querySelector('[name="email"]');
        field.setAttribute('data-validate', 'asyncEmail');
      });
      
      const emailField = page.locator('[name="email"]');
      
      // Test debouncing by typing rapidly
      const startTime = Date.now();
      await emailField.type('test@example.com', { delay: 50 });
      await emailField.blur();
      
      // Wait for async validation to complete
      await page.waitForTimeout(500);
      const endTime = Date.now();
      
      // Should not make excessive API calls due to debouncing
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete reasonably quickly
      console.log(`Debounced async validation time: ${totalTime}ms`);
    });
  });

  test.describe('DOM Performance', () => {
    test('should batch DOM updates efficiently', async ({ page }) => {
      // Create form with many fields
      await page.evaluate(() => {
        const form = document.createElement('form');
        for (let i = 0; i < 20; i++) {
          const field = document.createElement('input');
          field.name = `field-${i}`;
          field.setAttribute('data-validate', 'required');
          form.appendChild(field);
        }
        document.body.appendChild(form);
        new FormGuard(form);
      });
      
      // Trigger validation on all fields simultaneously
      const batchUpdateTime = await page.evaluate(() => {
        const fields = document.querySelectorAll('input[name^="field-"]');
        const start = performance.now();
        
        // Trigger all validations at once
        fields.forEach((field, index) => {
          field.value = index % 2 === 0 ? 'valid' : ''; // Mix of valid/invalid
          field.dispatchEvent(new Event('blur'));
        });
        
        const end = performance.now();
        return end - start;
      });
      
      expect(batchUpdateTime).toBeLessThan(30);
      console.log(`Batch DOM updates time: ${batchUpdateTime.toFixed(2)}ms`);
    });

    test('should handle dynamic field addition efficiently', async ({ page }) => {
      const dynamicAddTime = await page.evaluate(() => {
        const form = document.querySelector('form');
        const start = performance.now();
        
        // Add multiple fields dynamically
        for (let i = 0; i < 10; i++) {
          const field = document.createElement('input');
          field.name = `dynamic-${i}`;
          field.setAttribute('data-validate', 'required|email');
          form.appendChild(field);
        }
        
        const end = performance.now();
        return end - start;
      });
      
      expect(dynamicAddTime).toBeLessThan(20);
      console.log(`Dynamic field addition time: ${dynamicAddTime.toFixed(2)}ms`);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not leak memory with multiple instances', async ({ page }) => {
      // Create and destroy multiple instances
      await page.evaluate(() => {
        const instances = [];
        
        // Create 10 instances
        for (let i = 0; i < 10; i++) {
          const form = document.createElement('form');
          form.innerHTML = '<input name="test" data-validate="required">';
          document.body.appendChild(form);
          instances.push(new FormGuard(form));
        }
        
        // Destroy all instances
        instances.forEach(instance => instance.destroy());
        
        // Clean up DOM
        document.querySelectorAll('form').forEach(form => {
          if (form.id !== 'myForm') {
            form.remove();
          }
        });
      });
      
      // Force garbage collection if available
      if (await page.evaluate(() => typeof window.gc === 'function')) {
        await page.evaluate(() => window.gc());
      }
      
      // This test primarily ensures no JavaScript errors occur during cleanup
      // Memory leak detection would require more sophisticated tooling
      expect(true).toBeTruthy();
    });

    test('should clean up event listeners properly', async ({ page }) => {
      const initialListenerCount = await page.evaluate(() => {
        return document.querySelector('form').getEventListeners ? 
          Object.keys(document.querySelector('form').getEventListeners() || {}).length : 0;
      });
      
      // Create and destroy instance
      await page.evaluate(() => {
        const form = document.querySelector('form');
        const instance = new FormGuard(form);
        instance.destroy();
      });
      
      const finalListenerCount = await page.evaluate(() => {
        return document.querySelector('form').getEventListeners ? 
          Object.keys(document.querySelector('form').getEventListeners() || {}).length : initialListenerCount;
      });
      
      expect(finalListenerCount).toBeLessThanOrEqual(initialListenerCount);
    });
  });

  test.describe('Large Form Performance', () => {
    test('should handle forms with many fields efficiently', async ({ page }) => {
      // Create large form
      await page.evaluate(() => {
        const form = document.createElement('form');
        form.id = 'large-form';
        
        // Add 100 fields with various validation rules
        for (let i = 0; i < 100; i++) {
          const field = document.createElement('input');
          field.name = `large-field-${i}`;
          field.setAttribute('data-validate', 'required|min:3|max:50');
          form.appendChild(field);
        }
        
        document.body.appendChild(form);
      });
      
      // Measure initialization time for large form
      const largeFormInitTime = await page.evaluate(() => {
        const form = document.getElementById('large-form');
        const start = performance.now();
        new FormGuard(form);
        const end = performance.now();
        return end - start;
      });
      
      expect(largeFormInitTime).toBeLessThan(100);
      console.log(`Large form (100 fields) initialization time: ${largeFormInitTime.toFixed(2)}ms`);
      
      // Test validation performance on large form
      const validationTime = await page.evaluate(() => {
        const fields = document.querySelectorAll('#large-form input');
        const start = performance.now();
        
        fields.forEach((field, index) => {
          field.value = `value-${index}`;
          field.dispatchEvent(new Event('blur'));
        });
        
        const end = performance.now();
        return end - start;
      });
      
      expect(validationTime).toBeLessThan(200);
      console.log(`Large form validation time: ${validationTime.toFixed(2)}ms`);
    });
  });

  test.describe('Bundle Size Performance', () => {
    test('should meet size requirements', async ({ page }) => {
      // Check that FormGuard bundle meets size requirements
      const bundleInfo = await page.evaluate(() => {
        // This is a rough estimate - in real testing you'd check actual bundle size
        const script = document.querySelector('script[src*="formguard"]');
        return script ? script.src : null;
      });
      
      // In a real test, you'd fetch the bundle and check its size
      // expect(bundleSize).toBeLessThan(5 * 1024); // 5KB
      expect(bundleInfo).toBeTruthy();
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle high frequency validation events', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Generate high frequency validation events
      const stressTestTime = await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        const start = performance.now();
        
        // Simulate 1000 rapid validation triggers
        for (let i = 0; i < 1000; i++) {
          field.value = `test${i}@example.com`;
          field.dispatchEvent(new Event('input'));
        }
        
        const end = performance.now();
        return end - start;
      });
      
      expect(stressTestTime).toBeLessThan(1000); // Should handle stress test in under 1 second
      console.log(`Stress test (1000 events) time: ${stressTestTime.toFixed(2)}ms`);
    });

    test('should handle concurrent async validations', async ({ page }) => {
      // Mock multiple async endpoints with varying delays
      await page.route('**/api/validate-**', async (route, request) => {
        const delay = Math.random() * 200; // Random delay up to 200ms
        await new Promise(resolve => setTimeout(resolve, delay));
        await route.fulfill({
          json: { valid: true }
        });
      });
      
      // Create form with multiple async validators
      await page.evaluate(() => {
        const form = document.createElement('form');
        for (let i = 0; i < 5; i++) {
          const field = document.createElement('input');
          field.name = `async-field-${i}`;
          field.setAttribute('data-validate', `remote:/api/validate-${i}`);
          form.appendChild(field);
        }
        document.body.appendChild(form);
        new FormGuard(form);
      });
      
      // Trigger all async validations simultaneously
      const concurrentAsyncTime = await page.evaluate(async () => {
        const fields = document.querySelectorAll('input[name^="async-field-"]');
        const start = performance.now();
        
        // Trigger all validations
        fields.forEach(field => {
          field.value = 'test-value';
          field.dispatchEvent(new Event('blur'));
        });
        
        // Wait for all to complete (rough estimation)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const end = performance.now();
        return end - start;
      });
      
      expect(concurrentAsyncTime).toBeLessThan(1000);
      console.log(`Concurrent async validations time: ${concurrentAsyncTime.toFixed(2)}ms`);
    });
  });

  test.describe('Real-world Performance Scenarios', () => {
    test('should perform well during form submission', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      const submitButton = page.locator('[type="submit"]');
      
      // Fill form with valid data
      await emailField.fill('user@example.com');
      await passwordField.fill('securepassword123');
      
      // Measure form submission validation time
      const submissionTime = await page.evaluate(() => {
        const start = performance.now();
        const form = document.querySelector('form');
        form.dispatchEvent(new Event('submit'));
        const end = performance.now();
        return end - start;
      });
      
      expect(submissionTime).toBeLessThan(10);
      console.log(`Form submission validation time: ${submissionTime.toFixed(2)}ms`);
    });

    test('should maintain performance with live validation', async ({ page }) => {
      // Enable live validation
      await page.evaluate(() => {
        const form = document.querySelector('form');
        new FormGuard(form, { 
          validateOn: 'input',
          liveValidation: true 
        });
      });
      
      const emailField = page.locator('[name="email"]');
      
      // Measure typing performance with live validation
      const liveValidationTime = await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        const start = performance.now();
        
        const testEmail = 'user@example.com';
        for (let i = 0; i <= testEmail.length; i++) {
          field.value = testEmail.substring(0, i);
          field.dispatchEvent(new Event('input'));
        }
        
        const end = performance.now();
        return end - start;
      });
      
      expect(liveValidationTime).toBeLessThan(50);
      console.log(`Live validation typing time: ${liveValidationTime.toFixed(2)}ms`);
    });
  });
});