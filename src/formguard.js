/**
 * FormGuard - Lightweight, accessible, HTML-first form validation library
 * @version 1.0.0
 * @license MIT
 */

import { ValidatorRegistry } from './validators.js';
import { DOMManager } from './dom-manager.js';
import { AccessibilityManager } from './accessibility-manager.js';
import { I18n } from './i18n.js';
import {
  debounce,
  mergeDeep,
  getFieldValue,
  createEvent
} from './utils.js';

/**
 * Default configuration options
 */
const DEFAULT_OPTIONS = {
  validateOn: 'blur',           // 'blur', 'input', 'submit', 'manual'
  debounce: 300,               // Debounce delay for async validators (ms)
  errorClass: 'error',         // CSS class for invalid fields
  successClass: 'valid',       // CSS class for valid fields
  errorPlacement: 'after',     // 'after', 'before', 'append', 'custom'
  errorTemplate: '<div class="error-message" role="alert"></div>',
  customValidators: {},        // Custom validation functions
  messages: {},               // Custom error messages
  focusInvalid: true,         // Focus first invalid field on submit
  preventSubmit: true,        // Prevent form submission if invalid
  useNativeValidation: true,  // Use HTML5 constraint validation as first check
  announceErrors: true,       // Announce errors to screen readers
  liveValidation: true,       // Enable live validation during input
  submitValidation: true,     // Validate on form submission
  resetOnSubmit: false,       // Reset validation state after successful submit
  i18n: {                     // Internationalization options
    language: null,           // Auto-detect if null
    fallbackLanguage: 'en',   // Fallback language
    messages: {}              // Custom i18n messages
  }
};

/**
 * FormGuard main class
 */
export class FormGuard {
  /**
   * Global validator registry for all instances
   */
  static globalValidators = new ValidatorRegistry();
  
  /**
   * Array to track all FormGuard instances
   */
  static instances = [];
  
  /**
   * Constructor
   * @param {HTMLFormElement} form - Form element to validate
   * @param {Object} options - Configuration options
   */
  constructor(form, options = {}) {
    // Validate form element
    if (!form) {
      throw new Error('FormGuard requires a form element');
    }

    // In test environment, form might not be HTMLFormElement
    if (typeof HTMLFormElement !== 'undefined' && !(form instanceof HTMLFormElement)) {
      throw new Error('FormGuard requires a valid HTMLFormElement');
    }

    this.form = form;
    this.options = mergeDeep(DEFAULT_OPTIONS, options);
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Internal state with memory management
    this.validationState = new Map();
    this.asyncValidationPromises = new Map();
    this.debouncedValidators = new Map();
    this.eventListeners = [];

    // Memory management configuration
    this.maxStateEntries = options.maxStateEntries || 1000;
    this.stateCleanupInterval = options.stateCleanupInterval || 300000; // 5 minutes
    this.maxAsyncPromises = options.maxAsyncPromises || 100;

    // Cleanup timers
    this.cleanupTimer = null;
    this.lastCleanup = Date.now();
    
    // Initialize components
    this.validatorRegistry = new ValidatorRegistry();
    this.domManager = new DOMManager(this.options);
    this.accessibilityManager = new AccessibilityManager(this.options);

    // Initialize i18n
    this.i18n = new I18n({
      language: this.options.i18n.language,
      fallbackLanguage: this.options.i18n.fallbackLanguage,
      messages: this.options.i18n.messages
    });

    // Add custom validators
    this.addCustomValidators(this.options.customValidators);

    // Setup periodic cleanup for memory management
    this.setupPeriodicCleanup();

    // Initialize
    this.initialize();

    // Track instance
    FormGuard.instances.push(this);
  }

  /**
   * Setup periodic cleanup for memory management
   */
  setupPeriodicCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldState();
    }, this.stateCleanupInterval);
  }

  /**
   * Clean up old state to prevent memory leaks
   */
  cleanupOldState() {
    const now = Date.now();

    // Clean up old async promises
    for (const [key, promiseData] of this.asyncValidationPromises.entries()) {
      if (promiseData.timestamp && now - promiseData.timestamp > 60000) { // 1 minute old
        if (promiseData.controller) {
          promiseData.controller.abort();
        }
        this.asyncValidationPromises.delete(key);
      }
    }

    // Limit async promises size
    if (this.asyncValidationPromises.size > this.maxAsyncPromises) {
      const entries = Array.from(this.asyncValidationPromises.entries());
      const toDelete = entries.slice(0, entries.length - this.maxAsyncPromises);
      toDelete.forEach(([key, promiseData]) => {
        if (promiseData.controller) {
          promiseData.controller.abort();
        }
        this.asyncValidationPromises.delete(key);
      });
    }

    // Limit validation state size
    if (this.validationState.size > this.maxStateEntries) {
      const entries = Array.from(this.validationState.entries());
      const toDelete = entries.slice(0, entries.length - this.maxStateEntries);
      toDelete.forEach(([key]) => this.validationState.delete(key));
    }

    // Clean up debounced validators for removed fields
    for (const [field] of this.debouncedValidators.entries()) {
      if (!document.contains(field)) {
        this.debouncedValidators.delete(field);
      }
    }

    this.lastCleanup = now;
  }
  
  /**
   * Initialize FormGuard
   */
  initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize DOM manager
      this.domManager.initialize(this.form);
      
      // Setup accessibility
      this.accessibilityManager.setupKeyboardNavigation(this.form);
      this.accessibilityManager.ensureTabOrder(this.form);

      // Initialize ARIA attributes for all fields
      this.initializeAccessibilityAttributes();

      // Attach event listeners
      this.attachEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      // Dispatch initialization event
      this.dispatchEvent('formguard:init', {
        form: this.form,
        options: this.options
      });
      
    } catch (error) {
      console.error('FormGuard initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize accessibility attributes for all form fields
   */
  initializeAccessibilityAttributes() {
    const fields = this.domManager.getFields();
    fields.forEach(field => {
      // Set aria-required for required fields
      if (this.accessibilityManager.isRequiredField(field)) {
        field.setAttribute('aria-required', 'true');
      }

      // Set initial tabindex if needed
      if (!field.hasAttribute('tabindex')) {
        field.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const fields = this.domManager.getFields();
    
    // Form submission handler
    this.addEventListener(this.form, 'submit', this.handleFormSubmit.bind(this));
    
    // Form reset handler
    this.addEventListener(this.form, 'reset', this.handleFormReset.bind(this));
    
    // Field validation handlers based on validateOn option
    fields.forEach(field => {
      this.attachFieldListeners(field);
    });
  }
  
  /**
   * Attach listeners to a specific field
   * @param {HTMLElement} field - Form field element
   */
  attachFieldListeners(field) {
    const validateOn = this.options.validateOn;
    
    if (validateOn === 'blur' || validateOn === 'input') {
      this.addEventListener(field, validateOn, (event) => {
        this.validateField(event.target);
      });
    }
    
    // Always listen for input events for live validation if enabled
    if (this.options.liveValidation && validateOn !== 'input') {
      const debouncedValidate = this.getOrCreateDebouncedValidator(field);
      this.addEventListener(field, 'input', debouncedValidate);
    }
  }
  
  /**
   * Get or create debounced validator for a field
   * @param {HTMLElement} field - Form field element
   * @return {Function} Debounced validation function
   */
  getOrCreateDebouncedValidator(field) {
    if (!this.debouncedValidators.has(field)) {
      const debouncedFn = debounce(() => {
        this.validateField(field);
      }, this.options.debounce);
      
      this.debouncedValidators.set(field, debouncedFn);
    }
    
    return this.debouncedValidators.get(field);
  }
  
  /**
   * Add event listener and track for cleanup
   * @param {Element} element - Element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
  
  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleFormSubmit(event) {
    if (!this.options.submitValidation) return;
    
    // Prevent default submission temporarily
    event.preventDefault();
    
    try {
      const isValid = await this.validate();
      
      // Dispatch submit event
      this.dispatchEvent('formguard:submit', {
        form: this.form,
        valid: isValid,
        errors: this.getErrors()
      });
      
      if (isValid) {
        // Form is valid, allow submission
        if (this.options.resetOnSubmit) {
          this.reset();
        }
        
        // Re-submit the form
        if (this.options.preventSubmit === false) {
          this.form.submit();
        }
      } else {
        // Form is invalid, focus first invalid field
        if (this.options.focusInvalid) {
          this.focusFirstInvalid();
        }
        
        // Announce validation summary
        this.accessibilityManager.announceValidationSummary({
          isValid: false,
          errorCount: this.getErrorCount(),
          errors: this.getErrors()
        });
      }
    } catch (error) {
      console.error('FormGuard validation error:', error);
      
      // Allow form submission on validation errors to prevent blocking
      if (this.options.preventSubmit === false) {
        this.form.submit();
      }
    }
  }
  
  /**
   * Handle form reset
   * @param {Event} _event - Reset event (unused)
   */
  handleFormReset(_event) {
    // Allow default reset behavior
    setTimeout(() => {
      this.reset();
    }, 0);
  }
  
  /**
   * Validate the entire form or a specific field
   * @param {HTMLElement|string} field - Specific field to validate (optional)
   * @return {Promise<boolean>} Promise resolving to validation result
   */
  async validate(field = null) {
    if (this.isDestroyed) {
      throw new Error('FormGuard instance has been destroyed');
    }
    
    try {
      if (field) {
        // Validate specific field
        const fieldElement = typeof field === 'string' 
          ? this.form.querySelector(`[name="${field}"]`) 
          : field;
          
        if (!fieldElement) {
          throw new Error(`Field "${field}" not found`);
        }
        
        return await this.validateField(fieldElement);
      } else {
        // Validate all fields
        return await this.validateAllFields();
      }
    } catch (error) {
      console.error('FormGuard validation error:', error);
      return false;
    }
  }
  
  /**
   * Validate all fields in the form
   * @return {Promise<boolean>} Promise resolving to overall validation result
   */
  async validateAllFields() {
    const fields = this.domManager.getFields();
    const validationPromises = fields.map(field => this.validateField(field));

    try {
      const results = await Promise.all(validationPromises);
      const isValid = results.every(result => result === true);

      // Also validate all groups
      const groupResults = await this.validateAllGroups();

      return isValid && groupResults;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Validate all validation groups
   * @return {Promise<boolean>} Promise resolving to overall group validation result
   */
  async validateAllGroups() {
    const groups = this.getValidationGroups();
    const groupValidationPromises = Object.keys(groups).map(groupName =>
      this.validateGroup(groupName)
    );

    try {
      const results = await Promise.all(groupValidationPromises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Group validation error:', error);
      return false;
    }
  }
  
  /**
   * Validate a specific field
   * @param {HTMLElement} field - Form field element
   * @return {Promise<boolean>} Promise resolving to field validation result
   */
  async validateField(field) {
    if (!field || this.isDestroyed) return true;

    // First check HTML5 constraint validation if available
    if (this.options.useNativeValidation !== false && field.validity) {
      const nativeResult = this.checkNativeValidity(field);
      if (!nativeResult.valid) {
        this.setFieldError(field, nativeResult.message);
        return false;
      }
    }

    const fieldConfig = this.domManager.getFieldConfig(field);
    if (!fieldConfig) return true;

    // Check conditional validation
    if (!this.shouldValidateField(field, fieldConfig)) {
      this.clearFieldError(field);
      return true;
    }

    const value = getFieldValue(field);
    const rules = fieldConfig.rules || [];
    
    try {
      // Run all validation rules
      for (const rule of rules) {
        const result = await this.executeValidator(field, rule, value);
        
        if (result !== true) {
          // Validation failed
          const errorMessage = this.getErrorMessage(field, rule, result);
          this.setFieldError(field, errorMessage);
          return false;
        }
      }
      
      // All validations passed
      this.clearFieldError(field);
      return true;
      
    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error(`Validation error for field ${field.name}:`, error);
      }
      this.setFieldError(field, 'Validation error occurred');
      return false;
    }
  }
  
  /**
   * Check HTML5 native validation
   * @param {HTMLElement} field - Form field element
   * @return {Object} Validation result with valid flag and message
   */
  checkNativeValidity(field) {
    if (!field.validity) return { valid: true };

    const validity = field.validity;

    if (!validity.valid) {
      return {
        valid: false,
        message: this.getNativeValidationMessage(field, validity)
      };
    }

    return { valid: true };
  }

  /**
   * Get native validation error message
   * @param {HTMLElement} field - Form field element
   * @param {ValidityState} validity - Field validity state
   * @return {string} Error message
   */
  getNativeValidationMessage(field, validity) {
    // Use custom data attributes if available
    if (validity.valueMissing) return field.dataset.errorRequired || 'This field is required';
    if (validity.typeMismatch) return field.dataset.errorType || field.validationMessage;
    if (validity.patternMismatch) return field.dataset.errorPattern || 'Please match the required format';
    if (validity.tooLong) return field.dataset.errorMaxlength || `Maximum ${field.maxLength} characters allowed`;
    if (validity.tooShort) return field.dataset.errorMinlength || `Minimum ${field.minLength} characters required`;
    if (validity.rangeOverflow) return field.dataset.errorMax || `Value must be ${field.max} or less`;
    if (validity.rangeUnderflow) return field.dataset.errorMin || `Value must be ${field.min} or greater`;
    if (validity.stepMismatch) return field.dataset.errorStep || 'Please enter a valid value';

    // Fallback to browser's default message
    return field.validationMessage || 'Please enter a valid value';
  }

  /**
   * Check if field should be validated based on conditions
   * @param {HTMLElement} _field - Form field element (unused)
   * @param {Object} fieldConfig - Field configuration
   * @return {boolean} True if field should be validated
   */
  shouldValidateField(_field, fieldConfig) {
    if (!fieldConfig.validateIf) return true;
    
    // Parse validate-if condition: "fieldName:value"
    const [targetFieldName, expectedValue] = fieldConfig.validateIf.split(':');
    const targetField = this.form.querySelector(`[name="${targetFieldName}"]`);
    
    if (!targetField) {
      console.warn(`FormGuard: Conditional field "${targetFieldName}" not found`);
      return true;
    }
    
    const targetValue = getFieldValue(targetField);
    return String(targetValue) === expectedValue;
  }
  
  /**
   * Execute a validator rule with race condition prevention
   * @param {HTMLElement} field - Form field element
   * @param {Object} rule - Validation rule
   * @param {*} value - Field value
   * @return {Promise<boolean|string>} Validation result
   */
  async executeValidator(field, rule, value) {
    const validator = this.validatorRegistry.get(rule.name) ||
                     FormGuard.globalValidators.get(rule.name);

    if (!validator) {
      console.warn(`FormGuard: Validator "${rule.name}" not found`);
      return true;
    }

    try {
      if (this.isAsyncValidator(validator)) {
        const cacheKey = this.validatorRegistry.getCacheKey(rule.name, value, rule.params);
        const cachedResult = this.validatorRegistry.getFromCache(cacheKey);

        if (cachedResult !== undefined) {
          return cachedResult;
        }

        // Create a unique validation ID to handle race conditions
        const validationId = `${field.name || field.id}-${rule.name}-${Date.now()}-${Math.random()}`;

        // Cancel any existing validation for this field+rule combination
        const existingKey = `${field.name || field.id}-${rule.name}`;
        if (this.asyncValidationPromises.has(existingKey)) {
          const existing = this.asyncValidationPromises.get(existingKey);
          if (existing.controller) {
            existing.controller.abort();
          }
        }

        // Create abort controller for this validation
        const controller = new AbortController();
        const validationPromise = {
          id: validationId,
          controller,
          timestamp: Date.now(),
          promise: this.executeAsyncValidator(validator, value, rule.params, field, controller.signal)
        };

        this.asyncValidationPromises.set(existingKey, validationPromise);

        try {
          const result = await validationPromise.promise;

          // Only use result if this is still the current validation
          const currentValidation = this.asyncValidationPromises.get(existingKey);
          if (currentValidation && currentValidation.id === validationId) {
            this.validatorRegistry.setCache(cacheKey, result);
            this.asyncValidationPromises.delete(existingKey);
            return result;
          } else {
            // This validation was superseded, ignore result
            return true;
          }
        } catch (error) {
          this.asyncValidationPromises.delete(existingKey);
          if (error.name === 'AbortError') {
            return true; // Validation was cancelled
          }
          throw error;
        }
      } else {
        // Execute sync validator
        return validator(value, rule.params, field);
      }
    } catch (error) {
      console.error(`Validator "${rule.name}" execution error:`, error);
      return `Validation error: ${error.message}`;
    }
  }

  /**
   * Execute async validator with signal support
   * @param {Function} validator - Validator function
   * @param {*} value - Field value
   * @param {*} params - Validator parameters
   * @param {HTMLElement} field - Form field element
   * @param {AbortSignal} signal - Abort signal
   * @return {Promise<boolean|string>} Validation result
   */
  async executeAsyncValidator(validator, value, params, field, signal) {
    // Check if validator supports abort signal
    if (validator.length > 3) {
      // Validator accepts signal as 4th parameter
      return await validator(value, params, field, { signal });
    } else {
      // Validator doesn't support signal, wrap with timeout
      return await Promise.race([
        validator(value, params, field),
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('AbortError'));
          });
        })
      ]);
    }
  }
  
  /**
   * Check if a validator is asynchronous
   * @param {Function} validator - Validator function
   * @return {boolean} True if validator is async
   */
  isAsyncValidator(validator) {
    return validator.constructor.name === 'AsyncFunction' ||
           validator.toString().includes('async ') ||
           validator.toString().includes('Promise');
  }
  
  /**
   * Get error message for a validation rule
   * @param {HTMLElement} field - Form field element
   * @param {Object} rule - Validation rule
   * @param {string} result - Validation result
   * @return {string} Error message
   */
  getErrorMessage(field, rule, result) {
    // Use validator result if it's a string (already an error message)
    if (typeof result === 'string') {
      return result;
    }

    const fieldConfig = this.domManager.getFieldConfig(field);

    // Enhanced message context for interpolation
    const messageContext = {
      fieldName: this.getFieldDisplayName(field),
      fieldType: field.type,
      fieldValue: getFieldValue(field),
      ruleName: rule.name,
      ruleParams: rule.params,
      fieldLabel: this.getFieldLabel(field)
    };

    // Check for field-specific custom message with context interpolation
    if (fieldConfig.customMessages && fieldConfig.customMessages[rule.name]) {
      return this.interpolateMessage(fieldConfig.customMessages[rule.name], messageContext);
    }

    // Check for general custom message with context interpolation
    if (fieldConfig.errorMsg) {
      return this.interpolateMessage(fieldConfig.errorMsg, messageContext);
    }

    // Check for global custom messages with context interpolation
    if (this.options.messages && this.options.messages[rule.name]) {
      return this.interpolateMessage(this.options.messages[rule.name], messageContext);
    }

    // Enhanced i18n message generation with context
    return this.generateContextualMessage(field, rule, messageContext);
  }

  /**
   * Get user-friendly field display name
   * @param {HTMLElement} field - Form field element
   * @return {string} Display name for the field
   */
  getFieldDisplayName(field) {
    // Try various methods to get a user-friendly field name
    const label = this.getFieldLabel(field);
    if (label) return label;

    const placeholder = field.getAttribute('placeholder');
    if (placeholder) return placeholder;

    const title = field.getAttribute('title');
    if (title) return title;

    const name = field.name || field.id;
    if (name) {
      // Convert camelCase/snake_case to readable format
      return name.replace(/([A-Z])/g, ' $1')
                 .replace(/[_-]/g, ' ')
                 .toLowerCase()
                 .replace(/^\w/, c => c.toUpperCase())
                 .trim();
    }

    return 'field';
  }

  /**
   * Get field label text
   * @param {HTMLElement} field - Form field element
   * @return {string|null} Label text or null
   */
  getFieldLabel(field) {
    // Try to find associated label
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) {
        return label.textContent.trim().replace(/[*:]\s*$/, ''); // Remove trailing * or :
      }
    }

    // Check if field is inside a label
    const parentLabel = field.closest('label');
    if (parentLabel) {
      const labelText = parentLabel.textContent.trim();
      // Remove the field's own text content if it's an input
      if (field.tagName === 'INPUT' && field.value) {
        return labelText.replace(field.value, '').trim().replace(/[*:]\s*$/, '');
      }
      return labelText.replace(/[*:]\s*$/, '');
    }

    return null;
  }

  /**
   * Interpolate message with context variables
   * @param {string} message - Message template
   * @param {Object} context - Context variables
   * @return {string} Interpolated message
   */
  interpolateMessage(message, context) {
    if (typeof message !== 'string') return String(message);

    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  /**
   * Generate contextual i18n message
   * @param {HTMLElement} field - Form field element
   * @param {Object} rule - Validation rule
   * @param {Object} context - Message context
   * @return {string} Contextual error message
   */
  generateContextualMessage(field, rule, context) {
    // Handle special cases with parameters
    if (rule.name === 'min' || rule.name === 'max') {
      const isNumeric = field.type === 'number' || field.type === 'range';
      const messageKey = isNumeric ? `${rule.name}Value` : rule.name;
      return this.i18n.t(messageKey, rule.params);
    }

    // Handle field type specific messages
    if (rule.name === 'required') {
      if (field.type === 'checkbox') {
        return this.i18n.t('checkboxRequired');
      } else if (field.type === 'radio') {
        return this.i18n.t('radioRequired');
      } else if (field.type === 'file') {
        return this.i18n.t('fileRequired');
      } else if (field.multiple) {
        return this.i18n.t('selectRequired');
      }
    }

    // Try rule-specific i18n message
    if (this.i18n.getMessage(rule.name, this.i18n.getLanguage())) {
      return this.i18n.t(rule.name, rule.params);
    }

    // Final fallback with field name
    return this.i18n.t('invalidField', context.fieldName);
  }
  
  /**
   * Set error on a field
   * @param {HTMLElement} field - Form field element
   * @param {string} message - Error message
   */
  setFieldError(field, message) {
    // Update validation state
    this.validationState.set(field, { isValid: false, message });
    
    // Update DOM
    this.domManager.displayError(field, message);
    
    // Update accessibility
    const fieldData = this.domManager.fieldRegistry.get(field);
    const errorContainer = fieldData ? fieldData.errorContainer : null;
    this.accessibilityManager.setInvalid(field, message, errorContainer);
    
    // Dispatch invalid event
    this.dispatchEvent('formguard:invalid', {
      field,
      errors: [message],
      value: getFieldValue(field)
    });
  }
  
  /**
   * Clear error on a field
   * @param {HTMLElement} field - Form field element
   */
  clearFieldError(field) {
    // Update validation state
    this.validationState.set(field, { isValid: true, message: null });
    
    // Update DOM
    this.domManager.clearError(field);
    this.domManager.markValid(field);
    
    // Update accessibility
    this.accessibilityManager.setValid(field);
    
    // Dispatch valid event
    this.dispatchEvent('formguard:valid', {
      field,
      value: getFieldValue(field)
    });
  }
  
  /**
   * Get current validation errors
   * @return {Object} Object with field names as keys and error messages as values
   */
  getErrors() {
    const errors = {};
    
    this.validationState.forEach((state, field) => {
      if (!state.isValid && state.message) {
        const fieldName = field.name || field.id || 'unknown';
        errors[fieldName] = state.message;
      }
    });
    
    return errors;
  }
  
  /**
   * Get number of validation errors
   * @return {number} Number of errors
   */
  getErrorCount() {
    return Object.keys(this.getErrors()).length;
  }
  
  /**
   * Focus first invalid field
   */
  focusFirstInvalid() {
    const invalidFields = Array.from(this.validationState.entries())
      .filter(([, state]) => !state.isValid)
      .map(([field]) => field);

    this.accessibilityManager.focusFirstInvalid(invalidFields);
  }

  /**
   * Get all validation groups
   * @return {Object} Object with group names as keys and field arrays as values
   */
  getValidationGroups() {
    const groups = {};
    const fields = this.domManager.getFields();

    fields.forEach(field => {
      const fieldConfig = this.domManager.getFieldConfig(field);
      if (fieldConfig && fieldConfig.group) {
        if (!groups[fieldConfig.group]) {
          groups[fieldConfig.group] = [];
        }
        groups[fieldConfig.group].push(field);
      }
    });

    return groups;
  }

  /**
   * Validate a specific group
   * @param {string} groupName - Name of the group to validate
   * @return {Promise<boolean>} Promise resolving to group validation result
   */
  async validateGroup(groupName) {
    const groups = this.getValidationGroups();
    const groupFields = groups[groupName];

    if (!groupFields || groupFields.length === 0) {
      console.warn(`FormGuard: Group "${groupName}" not found or empty`);
      return true;
    }

    // Validate all fields in the group
    const validationPromises = groupFields.map(field => this.validateField(field));

    try {
      const results = await Promise.all(validationPromises);
      const isGroupValid = results.every(result => result === true);

      // Dispatch group validation event
      this.dispatchEvent('formguard:group-validated', {
        groupName,
        fields: groupFields,
        isValid: isGroupValid,
        errors: this.getGroupErrors(groupName)
      });

      return isGroupValid;
    } catch (error) {
      console.error(`Group validation error for "${groupName}":`, error);
      return false;
    }
  }

  /**
   * Get errors for a specific group
   * @param {string} groupName - Name of the group
   * @return {Object} Object with field names as keys and error messages as values
   */
  getGroupErrors(groupName) {
    const groups = this.getValidationGroups();
    const groupFields = groups[groupName] || [];
    const groupErrors = {};

    groupFields.forEach(field => {
      const state = this.validationState.get(field);
      if (state && !state.isValid && state.message) {
        const fieldName = field.name || field.id || 'unknown';
        groupErrors[fieldName] = state.message;
      }
    });

    return groupErrors;
  }

  /**
   * Clear errors for a specific group
   * @param {string} groupName - Name of the group
   */
  clearGroupErrors(groupName) {
    const groups = this.getValidationGroups();
    const groupFields = groups[groupName] || [];

    groupFields.forEach(field => {
      this.clearFieldError(field);
    });
  }
  
  /**
   * Reset validation state
   */
  reset() {
    // Clear validation state
    this.validationState.clear();
    
    // Clear async validation promises
    this.asyncValidationPromises.clear();
    
    // Clear validator cache
    this.validatorRegistry.clearCache();
    
    // Reset DOM
    this.domManager.reset();
    
    // Dispatch reset event
    this.dispatchEvent('formguard:reset', {
      form: this.form
    });
  }
  
  /**
   * Destroy FormGuard instance
   */
  destroy() {
    if (this.isDestroyed) return;

    try {
      // Clear cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      // Cancel all pending async validations
      for (const [, promiseData] of this.asyncValidationPromises.entries()) {
        try {
          if (promiseData.controller) {
            promiseData.controller.abort();
          }
        } catch (e) {
          // Ignore abort errors
        }
      }

      // Remove event listeners
      this.eventListeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (e) {
          // Ignore removal errors
        }
      });
      this.eventListeners = [];

      // Clear debounced validators
      this.debouncedValidators.clear();

      // Clear async promises
      this.asyncValidationPromises.clear();

      // Destroy managers
      try {
        this.domManager.destroy();
      } catch (e) {
        console.warn('FormGuard: Error destroying DOM manager:', e);
      }

      try {
        this.accessibilityManager.destroy();
      } catch (e) {
        console.warn('FormGuard: Error destroying accessibility manager:', e);
      }

      // Clear state
      this.validationState.clear();

      // Remove from instances
      const index = FormGuard.instances.indexOf(this);
      if (index > -1) {
        FormGuard.instances.splice(index, 1);
      }

      // Mark as destroyed
      this.isDestroyed = true;
    } catch (error) {
      console.error('FormGuard: Error during destruction:', error);
      // Still mark as destroyed to prevent further operations
      this.isDestroyed = true;
    }
  }
  
  /**
   * Add custom validators to instance
   * @param {Object} validators - Object with validator functions
   */
  addCustomValidators(validators) {
    Object.entries(validators).forEach(([name, validator]) => {
      this.validatorRegistry.register(name, validator);
    });
  }

  /**
   * Set language for this FormGuard instance
   * @param {string} language - Language code
   */
  setLanguage(language) {
    this.i18n.setLanguage(language);
  }

  /**
   * Get current language
   * @return {string} Current language code
   */
  getLanguage() {
    return this.i18n.getLanguage();
  }

  /**
   * Add custom messages for internationalization
   * @param {string|Object} language - Language code or object with multiple languages
   * @param {Object} messages - Messages object (if language is string)
   */
  addMessages(language, messages) {
    if (typeof language === 'string') {
      this.i18n.addMessages(language, messages);
    } else {
      this.i18n.addMessages(language);
    }
  }

  /**
   * Check if the form is currently valid
   * @return {boolean} True if form is valid
   */
  isValid() {
    const errors = this.getErrors();
    return Object.keys(errors).length === 0;
  }

  /**
   * Clear all field errors
   */
  clearAllErrors() {
    const fields = this.domManager.getFields();
    fields.forEach(field => {
      this.clearFieldError(field);
    });
  }

  /**
   * Get field validation state
   * @param {HTMLElement} field - Form field element
   * @return {Object} Field state object
   */
  getFieldState(field) {
    const state = this.validationState.get(field) || { isValid: true, message: null };
    return {
      isValid: state.isValid,
      errors: state.message ? [state.message] : [],
      isDirty: this.domManager.hasFieldChanged(field)
    };
  }

  /**
   * Trigger validation for a field with specific event type
   * @param {HTMLElement} field - Form field element
   * @param {string} eventType - Event type that triggered validation
   */
  triggerValidation(field, eventType = 'manual') {
    this.validateField(field).then(isValid => {
      this.dispatchEvent(`formguard:${eventType}-validation`, {
        field,
        isValid,
        eventType
      });
    });
  }

  /**
   * Add custom i18n messages
   * @param {string|Object} language - Language code or messages object
   * @param {Object} messages - Messages object (if first param is language)
   */
  addMessages(language, messages) {
    this.i18n.addMessages(language, messages);
  }
  
  /**
   * Dispatch custom event
   * @param {string} type - Event type
   * @param {Object} detail - Event detail
   */
  dispatchEvent(type, detail) {
    const event = createEvent(type, detail);
    this.form.dispatchEvent(event);
  }
  
  /**
   * Add global validator (static method)
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  static addValidator(name, validator) {
    FormGuard.globalValidators.register(name, validator);
  }
  
  /**
   * Auto-initialize FormGuard on forms with selector
   * @param {string} selector - CSS selector for forms
   * @param {Object} options - Configuration options
   * @return {Array} Array of FormGuard instances
   */
  static auto(selector = 'form[data-validate-form]', options = {}) {
    const forms = document.querySelectorAll(selector);
    const instances = [];
    
    forms.forEach(form => {
      try {
        instances.push(new FormGuard(form, options));
      } catch (error) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('FormGuard auto-initialization failed for form:', form, error);
        }
      }
    });
    
    return instances;
  }
  
  /**
   * Destroy all FormGuard instances
   */
  static destroyAll() {
    FormGuard.instances.forEach(instance => instance.destroy());
    FormGuard.instances = [];
  }
}