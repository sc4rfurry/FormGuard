/**
 * Tests for FormGuard main class
 */

import { FormGuard } from '../src/formguard.js';

// Helper function to create test forms
function createTestForm(innerHTML) {
  const form = document.createElement('form');
  form.innerHTML = innerHTML;

  // Create actual input elements for testing
  const inputs = [];
  if (innerHTML.includes('input')) {
    const input = document.createElement('input');
    input.type = 'email';
    input.name = 'email';
    input.value = '';
    input.setAttribute('data-validate', 'required|email');
    inputs.push(input);
    form.appendChild(input);
  }

  // Mock form methods
  form.addEventListener = jest.fn();
  form.removeEventListener = jest.fn();
  form.querySelectorAll = jest.fn((selector) => {
    if (selector.includes('input') || selector.includes('[data-validate]')) {
      return inputs;
    }
    return [];
  });
  form.querySelector = jest.fn((selector) => {
    const results = form.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  });
  form.contains = jest.fn(() => true);
  form.reset = jest.fn();
  form.submit = jest.fn();

  return form;
}

describe('FormGuard', () => {
  let form, formGuard;
  
  beforeEach(() => {
    // Create form manually to ensure it works
    form = document.createElement('form');

    // Create email field
    const emailField = document.createElement('input');
    emailField.type = 'email';
    emailField.name = 'email';
    emailField.setAttribute('data-validate', 'required|email');
    emailField.setAttribute('data-error-msg', 'Please enter a valid email');
    form.appendChild(emailField);

    // Create password field
    const passwordField = document.createElement('input');
    passwordField.type = 'password';
    passwordField.name = 'password';
    passwordField.setAttribute('data-validate', 'required|min:8');
    form.appendChild(passwordField);

    // Create confirm password field
    const confirmPasswordField = document.createElement('input');
    confirmPasswordField.type = 'password';
    confirmPasswordField.name = 'confirmPassword';
    confirmPasswordField.setAttribute('data-validate', 'required|match:password');
    form.appendChild(confirmPasswordField);

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);

    // Add form to document
    document.body.appendChild(form);

    // Verify form elements exist
    expect(form.querySelector('[name="email"]')).toBeTruthy();
    expect(form.querySelector('[name="password"]')).toBeTruthy();
    expect(form.querySelector('[name="confirmPassword"]')).toBeTruthy();
  });
  
  describe('Constructor', () => {
    test('should create FormGuard instance with valid form', () => {
      const formGuard = new FormGuard(form);
      
      expect(formGuard).toBeInstanceOf(FormGuard);
      expect(formGuard.form).toBe(form);
      expect(formGuard.isInitialized).toBe(true);
    });
    
    test('should throw error with invalid form element', () => {
      expect(() => {
        new FormGuard(null);
      }).toThrow('FormGuard requires a form element');

      expect(() => {
        new FormGuard(document.createElement('div'));
      }).toThrow('FormGuard requires a valid HTMLFormElement');
    });
    
    test('should merge options with defaults', () => {
      const customOptions = {
        validateOn: 'input',
        errorClass: 'custom-error'
      };
      
      const formGuard = new FormGuard(form, customOptions);
      
      expect(formGuard.options.validateOn).toBe('input');
      expect(formGuard.options.errorClass).toBe('custom-error');
      expect(formGuard.options.successClass).toBe('valid'); // default value
    });
    
    test('should track instances', () => {
      const initialCount = FormGuard.instances.length;
      const formGuard = new FormGuard(form);
      
      expect(FormGuard.instances.length).toBe(initialCount + 1);
      expect(FormGuard.instances.includes(formGuard)).toBe(true);
    });
  });
  
  describe('Initialization', () => {
    test('should dispatch init event', (done) => {
      form.addEventListener('formguard:init', (event) => {
        expect(event.detail.form).toBe(form);
        expect(event.detail.options).toBeDefined();
        done();
      });
      
      new FormGuard(form);
    });
    
    test('should not initialize twice', () => {
      const formGuard = new FormGuard(form);
      const initializeSpy = jest.spyOn(formGuard, 'initialize');
      
      formGuard.initialize();
      expect(initializeSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Field Validation', () => {
    let formGuard;
    
    beforeEach(() => {
      formGuard = new FormGuard(form);
    });
    
    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });
    
    test('should validate required field', async () => {
      const emailField = form.querySelector('[name="email"]');
      emailField.value = '';

      // Debug: Check if field is registered and has validation rules
      const fieldConfig = formGuard.domManager.getFieldConfig(emailField);
      expect(fieldConfig).toBeTruthy();
      expect(fieldConfig.rules.some(rule => rule.name === 'required')).toBe(true);

      const isValid = await formGuard.validateField(emailField);

      // Wait for DOM updates
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(isValid).toBe(false);
      expect(emailField.classList.contains('error')).toBe(true);
      expect(emailField.getAttribute('aria-invalid')).toBe('true');
    });
    
    test('should validate email format', async () => {
      const emailField = form.querySelector('[name="email"]');
      emailField.value = 'invalid-email';
      
      const isValid = await formGuard.validateField(emailField);
      
      expect(isValid).toBe(false);
    });
    
    test('should validate minimum length', async () => {
      const passwordField = form.querySelector('[name="password"]');
      passwordField.value = '123';
      
      const isValid = await formGuard.validateField(passwordField);
      
      expect(isValid).toBe(false);
    });
    
    test('should validate field matching', async () => {
      const passwordField = form.querySelector('[name="password"]');
      const confirmField = form.querySelector('[name="confirmPassword"]');
      
      passwordField.value = 'password123';
      confirmField.value = 'different';
      
      const isValid = await formGuard.validateField(confirmField);
      
      expect(isValid).toBe(false);
    });
    
    test('should validate all fields', async () => {
      // Set invalid values
      form.querySelector('[name="email"]').value = 'invalid';
      form.querySelector('[name="password"]').value = '123';
      form.querySelector('[name="confirmPassword"]').value = 'different';
      
      const isValid = await formGuard.validate();
      
      expect(isValid).toBe(false);
    });
    
    test('should pass validation with valid values', async () => {
      // Set valid values
      form.querySelector('[name="email"]').value = 'test@example.com';
      form.querySelector('[name="password"]').value = 'password123';
      form.querySelector('[name="confirmPassword"]').value = 'password123';
      
      const isValid = await formGuard.validate();
      
      expect(isValid).toBe(true);
    });
  });

  describe('Conditional Validation', () => {
    let formGuard;
    let conditionalForm;

    beforeEach(() => {
      // Create form manually to ensure elements exist
      conditionalForm = document.createElement('form');

      // Create checkbox
      const shippingSameField = document.createElement('input');
      shippingSameField.type = 'checkbox';
      shippingSameField.name = 'shippingSame';
      shippingSameField.value = 'true';
      conditionalForm.appendChild(shippingSameField);

      // Create shipping address field
      const shippingAddressField = document.createElement('input');
      shippingAddressField.type = 'text';
      shippingAddressField.name = 'shippingAddress';
      shippingAddressField.setAttribute('data-validate', 'required');
      shippingAddressField.setAttribute('data-validate-if', 'shippingSame:false');
      shippingAddressField.setAttribute('data-error-msg', 'Shipping address is required');
      conditionalForm.appendChild(shippingAddressField);

      // Create country select
      const countryField = document.createElement('select');
      countryField.name = 'country';
      const usOption = document.createElement('option');
      usOption.value = 'US';
      usOption.textContent = 'United States';
      const caOption = document.createElement('option');
      caOption.value = 'CA';
      caOption.textContent = 'Canada';
      countryField.appendChild(usOption);
      countryField.appendChild(caOption);
      conditionalForm.appendChild(countryField);

      // Create state field
      const stateField = document.createElement('input');
      stateField.type = 'text';
      stateField.name = 'state';
      stateField.setAttribute('data-validate', 'required');
      stateField.setAttribute('data-validate-if', 'country:US');
      stateField.setAttribute('data-error-msg', 'State is required for US addresses');
      conditionalForm.appendChild(stateField);

      document.body.appendChild(conditionalForm);
      formGuard = new FormGuard(conditionalForm);
    });

    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });

    test('should validate field when condition is met', async () => {
      const shippingSameField = conditionalForm.querySelector('[name="shippingSame"]');
      const shippingAddressField = conditionalForm.querySelector('[name="shippingAddress"]');

      // Set condition to false (checkbox unchecked)
      shippingSameField.checked = false;
      shippingAddressField.value = '';

      const isValid = await formGuard.validateField(shippingAddressField);

      expect(isValid).toBe(false);
      expect(shippingAddressField.classList.contains('error')).toBe(true);
    });

    test('should skip validation when condition is not met', async () => {
      const shippingSameField = conditionalForm.querySelector('[name="shippingSame"]');
      const shippingAddressField = conditionalForm.querySelector('[name="shippingAddress"]');

      // Set condition to true (checkbox checked)
      shippingSameField.checked = true;
      shippingAddressField.value = '';

      const isValid = await formGuard.validateField(shippingAddressField);

      expect(isValid).toBe(true);
      expect(shippingAddressField.classList.contains('error')).toBe(false);
    });

    test('should handle select field conditions', async () => {
      const countryField = conditionalForm.querySelector('[name="country"]');
      const stateField = conditionalForm.querySelector('[name="state"]');

      // Set country to US
      countryField.value = 'US';
      stateField.value = '';

      const isValid = await formGuard.validateField(stateField);

      expect(isValid).toBe(false);
      expect(stateField.classList.contains('error')).toBe(true);
    });

    test('should skip validation for non-matching select conditions', async () => {
      const countryField = conditionalForm.querySelector('[name="country"]');
      const stateField = conditionalForm.querySelector('[name="state"]');

      // Set country to CA (not US)
      countryField.value = 'CA';
      stateField.value = '';

      const isValid = await formGuard.validateField(stateField);

      expect(isValid).toBe(true);
      expect(stateField.classList.contains('error')).toBe(false);
    });
  });

  describe('Group Validation', () => {
    let formGuard;
    let groupForm;

    beforeEach(() => {
      groupForm = createTestForm(`
        <fieldset>
          <legend>Personal Information</legend>
          <input
            type="text"
            name="firstName"
            data-validate="required|min:2"
            data-validate-group="personal"
            data-error-msg="First name is required"
          >
          <input
            type="text"
            name="lastName"
            data-validate="required|min:2"
            data-validate-group="personal"
            data-error-msg="Last name is required"
          >
        </fieldset>

        <fieldset>
          <legend>Address Information</legend>
          <input
            type="text"
            name="street"
            data-validate="required|min:5"
            data-validate-group="address"
            data-error-msg="Street address is required"
          >
          <input
            type="text"
            name="city"
            data-validate="required|min:2"
            data-validate-group="address"
            data-error-msg="City is required"
          >
          <input
            type="text"
            name="zipCode"
            data-validate="required|pattern:[0-9]{5}"
            data-validate-group="address"
            data-error-msg="Valid ZIP code is required"
          >
        </fieldset>

        <input
          type="email"
          name="email"
          data-validate="required|email"
          data-error-msg="Valid email is required"
        >
      `);
      formGuard = new FormGuard(groupForm);
    });

    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });

    test('should identify validation groups correctly', () => {
      const groups = formGuard.getValidationGroups();

      expect(Object.keys(groups)).toEqual(['personal', 'address']);
      expect(groups.personal).toHaveLength(2);
      expect(groups.address).toHaveLength(3);

      // Check field names in groups
      const personalFieldNames = groups.personal.map(f => f.name);
      const addressFieldNames = groups.address.map(f => f.name);

      expect(personalFieldNames).toEqual(['firstName', 'lastName']);
      expect(addressFieldNames).toEqual(['street', 'city', 'zipCode']);
    });

    test('should validate a specific group successfully', async () => {
      const firstNameField = groupForm.querySelector('[name="firstName"]');
      const lastNameField = groupForm.querySelector('[name="lastName"]');

      firstNameField.value = 'John';
      lastNameField.value = 'Doe';

      const isValid = await formGuard.validateGroup('personal');

      expect(isValid).toBe(true);
      expect(firstNameField.classList.contains('error')).toBe(false);
      expect(lastNameField.classList.contains('error')).toBe(false);
    });

    test('should validate a specific group with errors', async () => {
      const firstNameField = groupForm.querySelector('[name="firstName"]');
      const lastNameField = groupForm.querySelector('[name="lastName"]');

      firstNameField.value = '';
      lastNameField.value = 'D';

      const isValid = await formGuard.validateGroup('personal');

      expect(isValid).toBe(false);
      expect(firstNameField.classList.contains('error')).toBe(true);
      expect(lastNameField.classList.contains('error')).toBe(true);
    });

    test('should get group errors correctly', async () => {
      const streetField = groupForm.querySelector('[name="street"]');
      const cityField = groupForm.querySelector('[name="city"]');
      const zipField = groupForm.querySelector('[name="zipCode"]');

      streetField.value = '';
      cityField.value = 'NYC';
      zipField.value = '123';

      await formGuard.validateGroup('address');
      const groupErrors = formGuard.getGroupErrors('address');

      expect(groupErrors).toHaveProperty('street');
      expect(groupErrors).toHaveProperty('zipCode');
      expect(groupErrors).not.toHaveProperty('city');
    });

    test('should clear group errors', async () => {
      const firstNameField = groupForm.querySelector('[name="firstName"]');
      const lastNameField = groupForm.querySelector('[name="lastName"]');

      // First create errors
      firstNameField.value = '';
      lastNameField.value = '';
      await formGuard.validateGroup('personal');

      expect(firstNameField.classList.contains('error')).toBe(true);
      expect(lastNameField.classList.contains('error')).toBe(true);

      // Then clear them
      formGuard.clearGroupErrors('personal');

      expect(firstNameField.classList.contains('error')).toBe(false);
      expect(lastNameField.classList.contains('error')).toBe(false);
    });

    test('should validate all groups', async () => {
      // Set valid values for personal group
      groupForm.querySelector('[name="firstName"]').value = 'John';
      groupForm.querySelector('[name="lastName"]').value = 'Doe';

      // Set invalid values for address group
      groupForm.querySelector('[name="street"]').value = '';
      groupForm.querySelector('[name="city"]').value = 'NYC';
      groupForm.querySelector('[name="zipCode"]').value = '12345';

      const isValid = await formGuard.validateAllGroups();

      expect(isValid).toBe(false);
    });

    test('should handle non-existent group gracefully', async () => {
      const isValid = await formGuard.validateGroup('nonexistent');

      expect(isValid).toBe(true);
    });

    test('should dispatch group validation events', async () => {
      let eventFired = false;
      let eventDetail = null;

      groupForm.addEventListener('formguard:group-validated', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      const firstNameField = groupForm.querySelector('[name="firstName"]');
      const lastNameField = groupForm.querySelector('[name="lastName"]');

      firstNameField.value = 'John';
      lastNameField.value = 'Doe';

      await formGuard.validateGroup('personal');

      expect(eventFired).toBe(true);
      expect(eventDetail).toHaveProperty('groupName', 'personal');
      expect(eventDetail).toHaveProperty('isValid', true);
      expect(eventDetail).toHaveProperty('fields');
      expect(eventDetail.fields).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    let formGuard;
    
    beforeEach(() => {
      formGuard = new FormGuard(form);
    });
    
    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });
    
    test('should set field error', () => {
      const emailField = form.querySelector('[name="email"]');
      
      formGuard.setFieldError(emailField, 'Custom error message');
      
      expect(emailField.classList.contains('error')).toBe(true);
      expect(emailField.getAttribute('aria-invalid')).toBe('true');
    });
    
    test('should clear field error', () => {
      const emailField = form.querySelector('[name="email"]');
      
      formGuard.setFieldError(emailField, 'Error message');
      formGuard.clearFieldError(emailField);
      
      expect(emailField.classList.contains('error')).toBe(false);
      expect(emailField.getAttribute('aria-invalid')).toBe('false');
    });
    
    test('should get current errors', async () => {
      form.querySelector('[name="email"]').value = '';
      form.querySelector('[name="password"]').value = '123';
      
      await formGuard.validate();
      
      const errors = formGuard.getErrors();
      expect(Object.keys(errors)).toHaveLength(2);
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });
    
    test('should count errors', async () => {
      form.querySelector('[name="email"]').value = '';
      form.querySelector('[name="password"]').value = '123';
      
      await formGuard.validate();
      
      expect(formGuard.getErrorCount()).toBe(2);
    });
  });
  
  describe('Form Submission', () => {
    let formGuard;
    
    beforeEach(() => {
      formGuard = new FormGuard(form);
    });
    
    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });
    
    test('should prevent invalid form submission', (done) => {
      form.querySelector('[name="email"]').value = '';
      
      form.addEventListener('formguard:submit', (event) => {
        expect(event.detail.valid).toBe(false);
        expect(event.detail.errors).toBeDefined();
        done();
      });
      
      form.dispatchEvent(new Event('submit'));
    });
    
    test('should allow valid form submission', (done) => {
      // Set valid values
      form.querySelector('[name="email"]').value = 'test@example.com';
      form.querySelector('[name="password"]').value = 'password123';
      form.querySelector('[name="confirmPassword"]').value = 'password123';
      
      form.addEventListener('formguard:submit', (event) => {
        expect(event.detail.valid).toBe(true);
        done();
      });
      
      form.dispatchEvent(new Event('submit'));
    });
  });
  
  describe('Event Handling', () => {
    let formGuard;
    
    beforeEach(() => {
      formGuard = new FormGuard(form);
    });
    
    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });
    
    test('should dispatch valid event', (done) => {
      const emailField = form.querySelector('[name="email"]');
      
      form.addEventListener('formguard:valid', (event) => {
        expect(event.detail.field).toBe(emailField);
        expect(event.detail.value).toBe('test@example.com');
        done();
      });
      
      emailField.value = 'test@example.com';
      formGuard.validateField(emailField);
    });
    
    test('should dispatch invalid event', (done) => {
      const emailField = form.querySelector('[name="email"]');
      
      form.addEventListener('formguard:invalid', (event) => {
        expect(event.detail.field).toBe(emailField);
        expect(event.detail.errors).toBeDefined();
        done();
      });
      
      emailField.value = '';
      formGuard.validateField(emailField);
    });
    
    test('should dispatch reset event', (done) => {
      form.addEventListener('formguard:reset', (event) => {
        expect(event.detail.form).toBe(form);
        done();
      });
      
      formGuard.reset();
    });
  });
  
  describe('Reset Functionality', () => {
    let formGuard;
    
    beforeEach(() => {
      formGuard = new FormGuard(form);
    });
    
    afterEach(() => {
      if (formGuard) {
        formGuard.destroy();
        formGuard = null;
      }
    });
    
    test('should reset validation state', async () => {
      // Trigger validation errors
      form.querySelector('[name="email"]').value = '';
      await formGuard.validate();
      
      expect(formGuard.getErrorCount()).toBeGreaterThan(0);
      
      // Reset
      formGuard.reset();
      
      expect(formGuard.getErrorCount()).toBe(0);
    });
    
    test('should clear field classes on reset', async () => {
      const emailField = form.querySelector('[name="email"]');
      emailField.value = '';
      
      await formGuard.validateField(emailField);
      expect(emailField.classList.contains('error')).toBe(true);
      
      formGuard.reset();
      expect(emailField.classList.contains('error')).toBe(false);
    });
  });
  
  describe('Destroy Functionality', () => {
    test('should clean up on destroy', () => {
      const formGuard = new FormGuard(form);
      const initialCount = FormGuard.instances.length;
      
      formGuard.destroy();
      
      expect(formGuard.isDestroyed).toBe(true);
      expect(FormGuard.instances.length).toBe(initialCount - 1);
    });
    
    test('should throw error when using destroyed instance', async () => {
      const formGuard = new FormGuard(form);
      formGuard.destroy();

      await expect(formGuard.validate()).rejects.toThrow('FormGuard instance has been destroyed');
    });
  });
  
  describe('Static Methods', () => {
    test('should add global validators', () => {
      const customValidator = (value) => value.length > 10;
      
      FormGuard.addValidator('custom', customValidator);
      
      expect(FormGuard.globalValidators.has('custom')).toBe(true);
    });
    
    test('should auto-initialize forms', () => {
      const autoForm = createTestForm(`
        <input data-validate="required" name="test">
      `);
      autoForm.setAttribute('data-validate-form', '');
      
      const instances = FormGuard.auto('[data-validate-form]');
      
      expect(instances.length).toBe(1);
      expect(instances[0]).toBeInstanceOf(FormGuard);
      
      // Cleanup
      instances.forEach(instance => instance.destroy());
    });
    
    test('should destroy all instances', () => {
      const form1 = createTestForm('<input data-validate="required">');
      const form2 = createTestForm('<input data-validate="required">');
      
      new FormGuard(form1);
      new FormGuard(form2);
      
      const initialCount = FormGuard.instances.length;
      expect(initialCount).toBeGreaterThanOrEqual(2);
      
      FormGuard.destroyAll();
      expect(FormGuard.instances.length).toBe(0);
    });
  });
  
  describe('Custom Validators', () => {
    test('should use custom validators from options', async () => {
      const customValidator = jest.fn().mockReturnValue(true);
      
      const customForm = createTestForm(`
        <input name="custom" data-validate="customRule">
      `);
      
      const formGuard = new FormGuard(customForm, {
        customValidators: {
          customRule: customValidator
        }
      });
      
      const field = customForm.querySelector('[name="custom"]');
      field.value = 'test';
      
      await formGuard.validateField(field);
      
      expect(customValidator).toHaveBeenCalledWith('test', null, field);
      
      formGuard.destroy();
    });
  });
  
  describe('Options Configuration', () => {
    test('should respect validateOn option', () => {
      const inputFormGuard = new FormGuard(form, { validateOn: 'input' });
      const blurFormGuard = new FormGuard(form, { validateOn: 'blur' });
      
      expect(inputFormGuard.options.validateOn).toBe('input');
      expect(blurFormGuard.options.validateOn).toBe('blur');
      
      inputFormGuard.destroy();
      blurFormGuard.destroy();
    });
    
    test('should respect custom CSS classes', () => {
      const formGuard = new FormGuard(form, {
        errorClass: 'custom-error',
        successClass: 'custom-success'
      });
      
      expect(formGuard.options.errorClass).toBe('custom-error');
      expect(formGuard.options.successClass).toBe('custom-success');
      
      formGuard.destroy();
    });
  });
});