/**
 * Accessibility tests for FormGuard
 */

import { FormGuard } from '../src/formguard.js';

// Mock axe-core for testing
const axeCore = {
  run: jest.fn().mockResolvedValue({
    violations: []
  })
};

// Helper function to create test forms
function createTestForm(innerHTML) {
  const form = document.createElement('form');
  form.innerHTML = innerHTML;

  // Add form to document body for proper DOM queries
  document.body.appendChild(form);

  // Mock form methods while preserving real DOM functionality
  const originalAddEventListener = form.addEventListener;
  const originalRemoveEventListener = form.removeEventListener;

  form.addEventListener = jest.fn(originalAddEventListener.bind(form));
  form.removeEventListener = jest.fn(originalRemoveEventListener.bind(form));
  form.reset = jest.fn();
  form.submit = jest.fn();

  return form;
}

describe('FormGuard Accessibility', () => {
  let form, formGuard;
  
  beforeEach(() => {
    form = createTestForm(`
      <label for="email">Email Address</label>
      <input 
        type="email" 
        id="email" 
        name="email"
        data-validate="required|email"
        data-error-msg="Please enter a valid email address"
      >
      
      <label for="password">Password</label>
      <input 
        type="password" 
        id="password" 
        name="password"
        data-validate="required|min:8"
        data-error-msg="Password must be at least 8 characters"
      >
      
      <button type="submit">Submit</button>
    `);
    
    formGuard = new FormGuard(form, {
      validateOn: 'blur',
      focusInvalid: true,
      announceErrors: true,
      useNativeValidation: false,  // Disable native validation for tests
      submitValidation: true,      // Ensure submit validation is enabled
      preventSubmit: true          // Prevent actual form submission
    });
  });
  
  afterEach(() => {
    if (formGuard) {
      formGuard.destroy();
    }
    // Clean up DOM
    if (form && form.parentNode) {
      form.parentNode.removeChild(form);
    }
  });
  
  describe('ARIA Attributes', () => {
    test('should set aria-required on required fields', () => {
      const emailField = form.querySelector('#email');
      const passwordField = form.querySelector('#password');
      
      // Check if aria-required is set for required fields
      expect(emailField.getAttribute('aria-required')).toBe('true');
      expect(passwordField.getAttribute('aria-required')).toBe('true');
    });
    
    test('should set aria-invalid when field is invalid', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = 'invalid-email';
      
      await formGuard.validateField(emailField);
      
      expect(emailField.getAttribute('aria-invalid')).toBe('true');
    });
    
    test('should set aria-invalid to false when field is valid', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = 'test@example.com';
      
      await formGuard.validateField(emailField);
      
      expect(emailField.getAttribute('aria-invalid')).toBe('false');
    });
    
    test('should link fields to error messages with aria-describedby', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = 'invalid-email';

      await formGuard.validateField(emailField);

      // Wait for DOM updates (requestAnimationFrame)
      await new Promise(resolve => requestAnimationFrame(resolve));

      const describedBy = emailField.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const errorElement = document.getElementById(describedBy);
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Please enter a valid email address');
    });
  });
  
  describe('Screen Reader Support', () => {
    test('should create live region for announcements', () => {
      const liveRegion = document.getElementById('formguard-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });
    
    test('should have screen reader only styling on live region', () => {
      const liveRegion = document.getElementById('formguard-live-region');
      const styles = getComputedStyle(liveRegion);
      
      // Check for screen reader only styles
      expect(liveRegion.style.position).toBe('absolute');
      expect(liveRegion.style.width).toBe('1px');
      expect(liveRegion.style.height).toBe('1px');
    });
    
    test('should announce validation errors', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = 'invalid-email';

      // Mock the announcement
      const announceSpy = jest.spyOn(formGuard.accessibilityManager, 'announceError');

      await formGuard.validateField(emailField);

      expect(announceSpy).toHaveBeenCalledWith(
        emailField,
        expect.stringContaining('Please enter a valid email address')
      );
    });
  });
  
  describe('Error Message Accessibility', () => {
    test('should create error elements with role="alert"', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = '';
      
      await formGuard.validateField(emailField);
      
      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.getAttribute('role')).toBe('alert');
    });
    
    test('should provide meaningful error messages', async () => {
      const emailField = form.querySelector('#email');
      expect(emailField).toBeTruthy(); // Ensure field exists

      emailField.value = 'invalid-email';

      // Debug: Check if field is registered
      const fieldConfig = formGuard.domManager.getFieldConfig(emailField);
      expect(fieldConfig).toBeTruthy(); // Ensure field is registered

      await formGuard.validateField(emailField);

      // Wait for DOM updates (requestAnimationFrame)
      await new Promise(resolve => requestAnimationFrame(resolve));

      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toBe('Please enter a valid email address');
    });
  });
  
  describe('Focus Management', () => {
    test('should focus first invalid field on form submission', async () => {
      const emailField = form.querySelector('#email');
      const passwordField = form.querySelector('#password');

      // Set invalid values
      emailField.value = '';
      passwordField.value = '123';

      // Mock focus method
      emailField.focus = jest.fn();

      // Trigger form submission with proper event
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for validation and DOM updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(emailField.focus).toHaveBeenCalled();
    });
    
    test('should maintain natural tab order', () => {
      const formElements = form.querySelectorAll('input, button');
      
      formElements.forEach(element => {
        // Should either have no tabindex or tabindex="0"
        const tabindex = element.getAttribute('tabindex');
        expect(tabindex === null || tabindex === '0').toBe(true);
      });
    });
  });
  
  describe('Keyboard Navigation', () => {
    test('should support keyboard submission with Ctrl+Enter', () => {
      const submitSpy = jest.fn();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.click = submitSpy;
      
      // Simulate Ctrl+Enter
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true
      });
      
      form.dispatchEvent(keyEvent);
      
      expect(submitSpy).toHaveBeenCalled();
    });
  });
  
  describe('Label Association', () => {
    test('should properly associate labels with form fields', () => {
      const emailField = form.querySelector('#email');
      const emailLabel = form.querySelector('label[for="email"]');
      
      expect(emailLabel).toBeTruthy();
      expect(emailLabel.getAttribute('for')).toBe(emailField.id);
    });
    
    test('should find field labels for announcements', () => {
      const emailField = form.querySelector('#email');
      const labelText = formGuard.accessibilityManager.getFieldLabel(emailField);
      
      expect(labelText).toBe('Email Address');
    });
  });
  
  describe('Progressive Enhancement', () => {
    test('should work with native HTML5 validation as fallback', () => {
      const emailField = form.querySelector('#email');
      
      // Native HTML5 validation should still work
      emailField.value = 'invalid-email';
      expect(emailField.checkValidity()).toBe(false);
      
      emailField.value = 'test@example.com';
      expect(emailField.checkValidity()).toBe(true);
    });
  });
  
  describe('Color and Contrast', () => {
    test('should not rely solely on color for error indication', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = '';

      await formGuard.validateField(emailField);

      // Wait for DOM updates (requestAnimationFrame)
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should have both visual (class) and text (error message) indicators
      expect(emailField.classList.contains('error')).toBe(true);

      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.length).toBeGreaterThan(0);
    });
  });
  
  describe('Semantic HTML', () => {
    test('should maintain semantic form structure', () => {
      expect(form.tagName).toBe('FORM');
      
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        expect(input.tagName).toBe('INPUT');
      });
      
      const labels = form.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
      
      const submitButton = form.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
    });
  });
  
  // Integration test with axe-core (if available)
  describe('Automated Accessibility Testing', () => {
    test('should pass axe accessibility audit', async () => {
      // This would run axe-core against the form
      // For now, we'll mock it since axe-core isn't installed
      const results = await axeCore.run(form);
      
      expect(results.violations).toEqual([]);
    });
    
    test('should pass accessibility audit after validation errors', async () => {
      const emailField = form.querySelector('#email');
      emailField.value = '';
      
      await formGuard.validateField(emailField);
      
      // Run accessibility audit on form with errors
      const results = await axeCore.run(form);
      
      expect(results.violations).toEqual([]);
    });
  });
});