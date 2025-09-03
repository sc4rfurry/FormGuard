/**
 * Visual Regression Testing with Playwright
 * Tests visual consistency across browsers and states
 */

import { test, expect } from '@playwright/test';

test.describe('FormGuard Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic-usage.html');
  });

  test.describe('Form State Visuals', () => {
    test('should render clean form state correctly', async ({ page }) => {
      // Take screenshot of clean form
      await expect(page.locator('form')).toHaveScreenshot('clean-form.png');
    });

    test('should render error states consistently', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      // Trigger errors on multiple fields
      await emailField.fill('invalid-email');
      await passwordField.fill('123'); // Too short
      
      await emailField.blur();
      await passwordField.blur();
      
      // Wait for error states to stabilize
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(300); // Allow animations to complete
      
      // Take screenshot of error state
      await expect(page.locator('form')).toHaveScreenshot('error-state-form.png');
    });

    test('should render valid states consistently', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      // Fill with valid data
      await emailField.fill('user@example.com');
      await passwordField.fill('securepassword123');
      
      await emailField.blur();
      await passwordField.blur();
      
      // Wait for validation to complete
      await page.waitForTimeout(500);
      
      // Take screenshot of valid state
      await expect(page.locator('form')).toHaveScreenshot('valid-state-form.png');
    });

    test('should render mixed validation states', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      // One valid, one invalid
      await emailField.fill('user@example.com'); // Valid
      await passwordField.fill('123'); // Invalid
      
      await emailField.blur();
      await passwordField.blur();
      
      await page.waitForTimeout(500);
      
      // Take screenshot of mixed state
      await expect(page.locator('form')).toHaveScreenshot('mixed-state-form.png');
    });
  });

  test.describe('Error Message Positioning', () => {
    test('should position error messages consistently - after placement', async ({ page }) => {
      // Test default 'after' placement
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(200);
      
      // Screenshot focusing on error message placement
      await expect(page.locator('.form-field').first()).toHaveScreenshot('error-placement-after.png');
    });

    test('should handle long error messages gracefully', async ({ page }) => {
      // Create a very long error message scenario
      await page.evaluate(() => {
        // Add a custom validator with a very long error message
        window.FormGuard.addValidator('longError', () => {
          return 'This is a very long error message that should wrap properly and not break the layout or cause visual issues in the form design';
        });
      });
      
      // Add field with long error validator
      await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        field.setAttribute('data-validate', 'longError');
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('trigger');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(200);
      
      await expect(page.locator('form')).toHaveScreenshot('long-error-message.png');
    });

    test('should handle multiple error messages per field', async ({ page }) => {
      // Create field with multiple validation rules that can fail
      await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        field.setAttribute('data-validate', 'required|email|min:10');
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('a'); // Fails required, email, and min length
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(200);
      
      await expect(page.locator('form')).toHaveScreenshot('multiple-errors.png');
    });
  });

  test.describe('Animation and Transition Visuals', () => {
    test('should capture error animation mid-state', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      // Try to capture during animation (timing-dependent)
      await page.waitForTimeout(100); // Catch mid-animation
      
      await expect(page.locator('form')).toHaveScreenshot('error-animation-mid-state.png');
    });

    test('should show completed error animations', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      
      // Wait for animations to complete
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(500);
      
      await expect(page.locator('form')).toHaveScreenshot('error-animation-complete.png');
    });
  });

  test.describe('Responsive Design Visuals', () => {
    test('should render correctly on mobile portrait', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(300);
      
      await expect(page.locator('form')).toHaveScreenshot('mobile-portrait-error.png');
    });

    test('should render correctly on mobile landscape', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(300);
      
      await expect(page.locator('form')).toHaveScreenshot('mobile-landscape-error.png');
    });

    test('should render correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      await emailField.fill('user@example.com');
      await passwordField.fill('invalid');
      
      await emailField.blur();
      await passwordField.blur();
      
      await page.waitForTimeout(500);
      
      await expect(page.locator('form')).toHaveScreenshot('tablet-mixed-state.png');
    });

    test('should render correctly on wide desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(300);
      
      await expect(page.locator('form')).toHaveScreenshot('desktop-wide-error.png');
    });
  });

  test.describe('Dark Mode and Theme Visuals', () => {
    test('should render correctly in dark mode', async ({ page }) => {
      // Emulate dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' });
      
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      await emailField.fill('user@example.com');
      await passwordField.fill('123');
      
      await emailField.blur();
      await passwordField.blur();
      
      await page.waitForTimeout(500);
      
      await expect(page.locator('form')).toHaveScreenshot('dark-mode-form.png');
    });

    test('should render correctly with reduced motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(100); // Shorter wait since animations should be reduced
      
      await expect(page.locator('form')).toHaveScreenshot('reduced-motion-error.png');
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should render identically across browsers', async ({ page, browserName }) => {
      const emailField = page.locator('[name="email"]');
      const passwordField = page.locator('[name="password"]');
      
      // Create a consistent test state
      await emailField.fill('test@example.com');
      await passwordField.fill('invalid123');
      
      await emailField.blur();
      await passwordField.blur();
      
      await page.waitForTimeout(500);
      
      // Use browser-specific screenshot names for comparison
      await expect(page.locator('form')).toHaveScreenshot(`cross-browser-${browserName}.png`);
    });

    test('should handle font rendering differences', async ({ page, browserName }) => {
      // Test with various font scenarios that might render differently
      await page.addStyleTag({
        content: `
          .error-message {
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.4;
          }
        `
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('This is a test of font rendering with a longer error message');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      await page.waitForTimeout(300);
      
      await expect(page.locator('.error-message').first()).toHaveScreenshot(`font-rendering-${browserName}.png`);
    });
  });

  test.describe('Loading and Async State Visuals', () => {
    test('should show loading state for async validation', async ({ page }) => {
      // Mock a slow async validator
      await page.route('**/api/check-username**', async route => {
        // Delay the response to capture loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          json: { available: false, message: 'Username taken' }
        });
      });
      
      // Add async validator
      await page.evaluate(() => {
        const field = document.querySelector('[name="email"]');
        field.setAttribute('data-validate', 'remote:/api/check-username');
      });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('testuser');
      
      // Capture loading state
      await page.waitForTimeout(200);
      await expect(page.locator('form')).toHaveScreenshot('async-loading-state.png');
      
      // Wait for completion and capture final state
      await page.waitForSelector('.error-message');
      await expect(page.locator('form')).toHaveScreenshot('async-complete-state.png');
    });
  });

  test.describe('Focus State Visuals', () => {
    test('should show focus indicators correctly', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.focus();
      
      // Capture focused state
      await expect(page.locator('form')).toHaveScreenshot('focus-indicator.png');
    });

    test('should show focus with error state', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      await emailField.fill('invalid');
      await emailField.blur();
      await page.waitForSelector('.error-message');
      
      // Focus the invalid field
      await emailField.focus();
      
      await expect(page.locator('form')).toHaveScreenshot('focus-with-error.png');
    });
  });
});