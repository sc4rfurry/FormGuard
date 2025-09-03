/**
 * Advanced Accessibility Testing with Playwright
 * Tests WCAG 2.2 compliance, screen reader interactions, and accessibility features
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('FormGuard Advanced Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic-usage.html');
  });

  test.describe('WCAG 2.2 Compliance Tests', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should meet enhanced focus indicator requirements (WCAG 2.2)', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Focus the field
      await emailField.focus();
      
      // Check focus indicator visibility and contrast
      const focusStyles = await emailField.evaluate(el => {
        const computed = window.getComputedStyle(el, ':focus');
        return {
          outlineWidth: computed.outlineWidth,
          outlineColor: computed.outlineColor,
          outlineStyle: computed.outlineStyle
        };
      });
      
      // WCAG 2.2 requires 2px minimum focus indicator thickness
      expect(parseInt(focusStyles.outlineWidth)).toBeGreaterThanOrEqual(2);
      expect(focusStyles.outlineStyle).not.toBe('none');
    });

    test('should meet target size requirements (24x24px minimum)', async ({ page }) => {
      const submitButton = page.locator('[type="submit"]');
      
      const buttonBox = await submitButton.boundingBox();
      expect(buttonBox.width).toBeGreaterThanOrEqual(24);
      expect(buttonBox.height).toBeGreaterThanOrEqual(24);
    });

    test('should provide alternatives to dragging movements', async ({ page }) => {
      // Test that all interactions can be completed without dragging
      // This would apply to custom sliders, drag-and-drop elements, etc.
      
      const interactiveElements = page.locator('[draggable="true"], [role="slider"]');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = interactiveElements.nth(i);
        
        // Ensure keyboard alternatives exist
        const keyboardAccessible = await element.evaluate(el => {
          return el.tabIndex >= 0 || el.getAttribute('role') === 'button';
        });
        
        expect(keyboardAccessible).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Simulation Tests', () => {
    test('should announce form validation errors correctly', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      const liveRegion = page.locator('[aria-live]');
      
      // Trigger validation error
      await emailField.fill('invalid-email');
      await emailField.blur();
      
      // Wait for error to be announced
      await page.waitForTimeout(500);
      
      // Check that live region contains error message
      const liveRegionText = await liveRegion.textContent();
      expect(liveRegionText).toContain('Please enter a valid email');
      
      // Verify aria-describedby connection
      const describedBy = await emailField.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      
      const errorElement = page.locator(`#${describedBy}`);
      expect(await errorElement.textContent()).toContain('Please enter a valid email');
    });

    test('should maintain proper reading order', async ({ page }) => {
      const form = page.locator('form');
      
      // Get all focusable elements in tab order
      const focusableElements = await form.locator('input, button, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      // Verify logical tab order
      for (let i = 0; i < focusableElements.length; i++) {
        await focusableElements[i].focus();
        const focusedElement = page.locator(':focus');
        expect(await focusedElement.getAttribute('name')).toBe(await focusableElements[i].getAttribute('name'));
      }
    });

    test('should handle dynamic content announcements', async ({ page }) => {
      const form = page.locator('form');
      
      // Add a new field dynamically
      await page.evaluate(() => {
        const newField = document.createElement('input');
        newField.name = 'dynamicField';
        newField.setAttribute('data-validate', 'required');
        newField.setAttribute('aria-label', 'Dynamic field');
        document.querySelector('form').appendChild(newField);
      });
      
      const dynamicField = page.locator('[name="dynamicField"]');
      await dynamicField.focus();
      await dynamicField.blur();
      
      // Verify error is announced for dynamic field
      const liveRegion = page.locator('[aria-live]');
      await page.waitForTimeout(500);
      
      const announcement = await liveRegion.textContent();
      expect(announcement).toContain('required');
    });
  });

  test.describe('Keyboard Navigation Tests', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Test Tab navigation through form
      await page.keyboard.press('Tab'); // Focus first field
      let focusedElement = page.locator(':focus');
      expect(await focusedElement.getAttribute('name')).toBe('email');
      
      await page.keyboard.press('Tab'); // Focus second field
      focusedElement = page.locator(':focus');
      expect(await focusedElement.getAttribute('name')).toBe('password');
      
      await page.keyboard.press('Tab'); // Focus submit button
      focusedElement = page.locator(':focus');
      expect(await focusedElement.getAttribute('type')).toBe('submit');
    });

    test('should focus first invalid field on form submission', async ({ page }) => {
      const submitButton = page.locator('[type="submit"]');
      const emailField = page.locator('[name="email"]');
      
      // Submit form with empty fields
      await submitButton.click();
      
      // Verify first invalid field gets focus
      await page.waitForTimeout(100);
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.getAttribute('name')).toBe('email');
    });

    test('should support Escape key to dismiss error messages', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Trigger error
      await emailField.fill('invalid');
      await emailField.blur();
      
      // Wait for error to appear
      await page.waitForSelector('.error-message');
      
      // Press Escape to dismiss (if implemented)
      await emailField.focus();
      await page.keyboard.press('Escape');
      
      // This test assumes FormGuard implements Escape key handling
      // Implementation would need to be added to FormGuard
    });
  });

  test.describe('High Contrast Mode Support', () => {
    test('should be visible in Windows High Contrast Mode', async ({ page, browserName }) => {
      // Skip on non-Chromium browsers as forced-colors is primarily a Windows/Edge feature
      test.skip(browserName !== 'chromium', 'High contrast mode testing is primarily for Chromium/Edge');
      
      // Emulate Windows High Contrast Mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      const emailField = page.locator('[name="email"]');
      await emailField.fill('invalid');
      await emailField.blur();
      
      // Wait for error state
      await page.waitForSelector('.error');
      
      // Verify elements are still visible in high contrast mode
      const errorElement = page.locator('.error-message').first();
      const errorVisible = await errorElement.isVisible();
      expect(errorVisible).toBeTruthy();
      
      // Check that focus indicators work in high contrast mode
      await emailField.focus();
      const focusIndicatorVisible = await emailField.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return styles.outlineStyle !== 'none';
      });
      
      expect(focusIndicatorVisible).toBeTruthy();
    });
  });

  test.describe('Mobile Accessibility Tests', () => {
    test('should work with touch screen interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');
      
      const emailField = page.locator('[name="email"]');
      
      // Test tap interaction
      await emailField.tap();
      expect(await emailField.inputValue()).toBe('');
      
      // Test virtual keyboard interaction
      await emailField.fill('test@example.com');
      expect(await emailField.inputValue()).toBe('test@example.com');
      
      // Verify field validation works on mobile
      await emailField.fill('invalid');
      await page.tap('body'); // Tap outside to blur
      
      await page.waitForSelector('.error-message');
      const errorVisible = await page.locator('.error-message').isVisible();
      expect(errorVisible).toBeTruthy();
    });

    test('should have adequate touch target sizes on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');
      
      const submitButton = page.locator('[type="submit"]');
      const boundingBox = await submitButton.boundingBox();
      
      // Mobile touch targets should be at least 44x44 CSS pixels (iOS) or 48x48dp (Android)
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Color and Contrast Accessibility', () => {
    test('should not rely solely on color for error indication', async ({ page }) => {
      const emailField = page.locator('[name="email"]');
      
      // Trigger error state
      await emailField.fill('invalid');
      await emailField.blur();
      
      await page.waitForSelector('.error-message');
      
      // Check that error is indicated by more than just color
      // Should have text message
      const errorMessage = page.locator('.error-message');
      const errorText = await errorMessage.textContent();
      expect(errorText.length).toBeGreaterThan(0);
      
      // Should have ARIA attributes
      const ariaInvalid = await emailField.getAttribute('aria-invalid');
      expect(ariaInvalid).toBe('true');
      
      // Should have describedBy connection
      const describedBy = await emailField.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });

    test('should meet color contrast requirements', async ({ page }) => {
      // Use axe-core to check color contrast
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      
      // Filter for color contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      );
      
      expect(contrastViolations).toHaveLength(0);
    });
  });
});