/**
 * DOM management utilities for FormGuard
 */

import { generateId, getFieldValue, parseValidationRules, safeFocus, rafThrottle } from './utils.js';

/**
 * DOMManager class for handling DOM operations
 */
export class DOMManager {
  constructor(options = {}) {
    this.options = {
      errorClass: 'error',
      successClass: 'valid',
      errorPlacement: 'after',
      errorTemplate: '<div class="error-message" role="alert"></div>',
      ...options
    };
    
    this.fieldRegistry = new Map();
    this.mutationObserver = null;
    this.batchedUpdates = new Set();
    this.scheduledUpdate = false;
    
    // Throttled DOM update function
    this.performBatchUpdate = rafThrottle(() => {
      this.batchedUpdates.forEach(update => update());
      this.batchedUpdates.clear();
      this.scheduledUpdate = false;
    });
  }
  
  /**
   * Initialize DOM manager for a form
   * @param {HTMLFormElement} form - Form element
   */
  initialize(form) {
    this.form = form;
    this.scanFields();
    this.setupMutationObserver();
  }
  
  /**
   * Scan form for validation fields
   */
  scanFields() {
    const fields = this.form.querySelectorAll('[data-validate]:not([data-no-validate])');
    fields.forEach(field => this.attachField(field));
  }
  
  /**
   * Setup MutationObserver for dynamic fields with enhanced resilience
   */
  setupMutationObserver() {
    if (!window.MutationObserver) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('FormGuard: MutationObserver not supported, falling back to periodic scanning');
      }
      this.setupPeriodicScanning();
      return;
    }

    // Throttle mutation processing to prevent performance issues
    const throttledMutationHandler = this.throttleMutations(mutations => {
      this.processMutations(mutations);
    }, 100);

    try {
      this.mutationObserver = new MutationObserver(throttledMutationHandler);

      this.mutationObserver.observe(this.form, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-validate', 'data-no-validate']
      });

      // Monitor observer health
      this.monitorObserverHealth();

    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('FormGuard: Failed to setup MutationObserver:', error);
      }
      // Fallback to periodic scanning
      this.setupPeriodicScanning();
    }
  }

  /**
   * Throttle mutation processing to prevent performance issues
   * @param {Function} callback - Callback function
   * @param {number} delay - Throttle delay in milliseconds
   * @return {Function} Throttled function
   */
  throttleMutations(callback, delay) {
    let timeoutId;
    let pendingMutations = [];

    return (mutations) => {
      pendingMutations.push(...mutations);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (pendingMutations.length > 0) {
          callback(pendingMutations);
          pendingMutations = [];
        }
      }, delay);
    };
  }

  /**
   * Process mutations with error handling
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  processMutations(mutations) {
    let hasChanges = false;

    try {
      mutations.forEach((mutation) => {
        try {
          if (mutation.type === 'childList') {
            hasChanges = this.processChildListMutation(mutation) || hasChanges;
          } else if (mutation.type === 'attributes') {
            hasChanges = this.processAttributeMutation(mutation) || hasChanges;
          }
        } catch (error) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('FormGuard: Error processing mutation:', error);
          }
        }
      });

      if (hasChanges) {
        this.scheduleUpdate(() => {
          // Notify FormGuard of changes
          if (this.onFieldsChanged) {
            this.onFieldsChanged();
          }
        });
      }
    } catch (error) {
      console.error('FormGuard: Error processing mutations:', error);
    }
  }

  /**
   * Process child list mutations
   * @param {MutationRecord} mutation - Mutation record
   * @return {boolean} Whether changes were detected
   */
  processChildListMutation(mutation) {
    let hasChanges = false;

    // Handle added nodes
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          if (node.hasAttribute && node.hasAttribute('data-validate') && !node.hasAttribute('data-no-validate')) {
            this.attachField(node);
            hasChanges = true;
          }

          // Check child elements
          const childFields = node.querySelectorAll('[data-validate]:not([data-no-validate])');
          childFields.forEach(field => {
            this.attachField(field);
            hasChanges = true;
          });
        } catch (error) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('FormGuard: Error processing added node:', error);
          }
        }
      }
    });

    // Handle removed nodes
    mutation.removedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          if (node.hasAttribute && node.hasAttribute('data-validate')) {
            this.detachField(node);
            hasChanges = true;
          }

          // Check child elements
          const childFields = node.querySelectorAll('[data-validate]');
          childFields.forEach(field => {
            this.detachField(field);
            hasChanges = true;
          });
        } catch (error) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('FormGuard: Error processing removed node:', error);
          }
        }
      }
    });

    return hasChanges;
  }

  /**
   * Process attribute mutations
   * @param {MutationRecord} mutation - Mutation record
   * @return {boolean} Whether changes were detected
   */
  processAttributeMutation(mutation) {
    if (mutation.attributeName === 'data-validate' ||
        mutation.attributeName === 'data-no-validate') {
      try {
        const target = mutation.target;

        if (target.hasAttribute('data-validate') &&
            !target.hasAttribute('data-no-validate')) {
          this.attachField(target);
        } else {
          this.detachField(target);
        }
        return true;
      } catch (error) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.warn('FormGuard: Error processing attribute mutation:', error);
        }
      }
    }
    return false;
  }

  /**
   * Monitor observer health and reconnect if needed
   */
  monitorObserverHealth() {
    // Periodically check if observer is still connected
    this.observerHealthCheck = setInterval(() => {
      try {
        if (this.mutationObserver && !document.contains(this.form)) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('FormGuard: Form removed from DOM, cleaning up observer');
          }
          this.destroy();
        }
      } catch (error) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.warn('FormGuard: Observer health check failed:', error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup periodic scanning as fallback when MutationObserver fails
   */
  setupPeriodicScanning() {
    // Fallback mechanism when MutationObserver fails
    this.periodicScanInterval = setInterval(() => {
      try {
        this.scanForNewFields();
      } catch (error) {
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.warn('FormGuard: Periodic scan failed:', error);
        }
      }
    }, 5000); // Scan every 5 seconds
  }

  /**
   * Scan for new fields manually
   */
  scanForNewFields() {
    const currentFields = new Set(this.fieldRegistry.keys());
    const allFields = this.form.querySelectorAll('[data-validate]:not([data-no-validate])');

    allFields.forEach(field => {
      if (!currentFields.has(field)) {
        this.attachField(field);
      }
    });
  }
  
  /**
   * Attach a field for validation
   * @param {HTMLElement} field - Form field element
   */
  attachField(field) {
    if (this.fieldRegistry.has(field)) return;
    
    const config = this.parseFieldConfig(field);
    
    // Assign unique ID if needed
    if (!field.id) {
      field.id = generateId('field');
    }
    
    // Setup error container
    const errorContainer = this.createErrorContainer(field);
    
    this.fieldRegistry.set(field, {
      config,
      errorContainer,
      lastValue: getFieldValue(field),
      isValid: null
    });
  }
  
  /**
   * Detach a field from validation
   * @param {HTMLElement} field - Form field element
   */
  detachField(field) {
    const fieldData = this.fieldRegistry.get(field);
    if (fieldData) {
      this.clearError(field);
      this.fieldRegistry.delete(field);
    }
  }
  
  /**
   * Parse field validation configuration
   * @param {HTMLElement} field - Form field element
   * @return {Object} Field configuration
   */
  parseFieldConfig(field) {
    const validateAttr = field.getAttribute('data-validate');
    const rules = parseValidationRules(validateAttr);
    
    return {
      rules,
      validateIf: field.getAttribute('data-validate-if'),
      errorMsg: field.getAttribute('data-error-msg'),
      errorTarget: field.getAttribute('data-error-target'),
      group: field.getAttribute('data-validate-group'),
      customMessages: this.parseCustomMessages(field)
    };
  }
  
  /**
   * Parse custom error messages from data attributes
   * @param {HTMLElement} field - Form field element
   * @return {Object} Custom messages object
   */
  parseCustomMessages(field) {
    const messages = {};
    const attributes = field.attributes;
    
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      const match = attr.name.match(/^data-error-(.+)$/);
      if (match) {
        messages[match[1]] = attr.value;
      }
    }
    
    return messages;
  }
  
  /**
   * Create error container for a field
   * @param {HTMLElement} field - Form field element
   * @return {HTMLElement} Error container element
   */
  createErrorContainer(field) {
    const config = this.parseFieldConfig(field);
    
    // Check for custom error target
    if (config.errorTarget) {
      const customTarget = document.querySelector(config.errorTarget);
      if (customTarget) {
        return customTarget;
      }
    }
    
    // Create error element
    const errorElement = this.createErrorElement(field);
    
    // Place error element based on configuration
    switch (this.options.errorPlacement) {
      case 'before':
        field.parentNode.insertBefore(errorElement, field);
        break;
      case 'after':
      default:
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        break;
      case 'append':
        field.parentNode.appendChild(errorElement);
        break;
    }
    
    return errorElement;
  }
  
  /**
   * Create error message element
   * @param {HTMLElement} field - Form field element
   * @return {HTMLElement} Error element
   */
  createErrorElement(field) {
    const template = document.createElement('div');

    // Sanitize the error template to prevent XSS
    const sanitizedTemplate = this.sanitizeTemplate(this.options.errorTemplate);
    template.innerHTML = sanitizedTemplate;

    const errorElement = template.firstElementChild;

    if (!errorElement) {
      // Fallback if template is invalid
      const fallbackElement = document.createElement('div');
      fallbackElement.className = 'error-message';
      fallbackElement.setAttribute('role', 'alert');
      return this.setupErrorElement(fallbackElement, field);
    }

    return this.setupErrorElement(errorElement, field);
  }

  /**
   * Setup error element with security attributes
   * @param {HTMLElement} errorElement - Error element to setup
   * @param {HTMLElement} field - Form field element
   * @return {HTMLElement} Configured error element
   */
  setupErrorElement(errorElement, field) {
    errorElement.id = `${field.id}-error`;
    errorElement.style.display = 'none';

    // Ensure security attributes
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');

    return errorElement;
  }

  /**
   * Sanitize HTML template to prevent XSS
   * @param {string} template - HTML template string
   * @return {string} Sanitized template
   */
  sanitizeTemplate(template) {
    if (typeof template !== 'string') {
      return '<div class="error-message" role="alert"></div>';
    }

    // Basic template sanitization - remove script tags and event handlers
    return template
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/<object\b[^>]*>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '');
  }

  /**
   * Sanitize error message to prevent XSS
   * @param {string} message - Error message
   * @return {string} Sanitized message
   */
  sanitizeErrorMessage(message) {
    // Ensure message is a string and remove any HTML
    const stringMessage = String(message || '');
    const div = document.createElement('div');
    div.textContent = stringMessage;
    return div.textContent || div.innerText || '';
  }
  
  /**
   * Schedule a batched DOM update
   * @param {Function} updateFn - Update function to batch
   */
  scheduleUpdate(updateFn) {
    this.batchedUpdates.add(updateFn);
    
    if (!this.scheduledUpdate) {
      this.scheduledUpdate = true;
      this.performBatchUpdate();
    }
  }
  
  /**
   * Display error message for a field
   * @param {HTMLElement} field - Form field element
   * @param {string} message - Error message
   */
  displayError(field, message) {
    this.scheduleUpdate(() => {
      const fieldData = this.fieldRegistry.get(field);
      if (!fieldData) return;

      const errorContainer = fieldData.errorContainer;

      // Sanitize error message to prevent XSS
      const sanitizedMessage = this.sanitizeErrorMessage(message);
      errorContainer.textContent = sanitizedMessage; // Use textContent instead of innerHTML
      errorContainer.style.display = 'block';

      // Update field classes
      field.classList.add(this.options.errorClass);
      field.classList.remove(this.options.successClass);

      // Update ARIA attributes
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorContainer.id);

      fieldData.isValid = false;
    });
  }
  
  /**
   * Clear error message for a field
   * @param {HTMLElement} field - Form field element
   */
  clearError(field) {
    this.scheduleUpdate(() => {
      const fieldData = this.fieldRegistry.get(field);
      if (!fieldData) return;
      
      const errorContainer = fieldData.errorContainer;
      
      // Hide error message
      errorContainer.style.display = 'none';
      errorContainer.textContent = '';
      
      // Update field classes
      field.classList.remove(this.options.errorClass);
      
      // Update ARIA attributes
      field.setAttribute('aria-invalid', 'false');
      field.removeAttribute('aria-describedby');
      
      fieldData.isValid = true;
    });
  }
  
  /**
   * Mark field as valid
   * @param {HTMLElement} field - Form field element
   */
  markValid(field) {
    this.scheduleUpdate(() => {
      const fieldData = this.fieldRegistry.get(field);
      if (!fieldData) return;
      
      // Clear any existing errors
      this.clearError(field);
      
      // Add success class
      field.classList.add(this.options.successClass);
      
      fieldData.isValid = true;
    });
  }
  
  /**
   * Get all registered fields
   * @return {Array} Array of field elements
   */
  getFields() {
    return Array.from(this.fieldRegistry.keys());
  }
  
  /**
   * Get field configuration
   * @param {HTMLElement} field - Form field element
   * @return {Object|null} Field configuration or null
   */
  getFieldConfig(field) {
    const fieldData = this.fieldRegistry.get(field);
    return fieldData ? fieldData.config : null;
  }
  
  /**
   * Check if field has changed since last validation
   * @param {HTMLElement} field - Form field element
   * @return {boolean} True if field has changed
   */
  hasFieldChanged(field) {
    const fieldData = this.fieldRegistry.get(field);
    if (!fieldData) return false;
    
    const currentValue = getFieldValue(field);
    const hasChanged = currentValue !== fieldData.lastValue;
    
    if (hasChanged) {
      fieldData.lastValue = currentValue;
    }
    
    return hasChanged;
  }
  
  /**
   * Focus the first invalid field
   */
  focusFirstInvalid() {
    const fields = this.getFields();
    const firstInvalid = fields.find(field => {
      const fieldData = this.fieldRegistry.get(field);
      return fieldData && fieldData.isValid === false;
    });
    
    if (firstInvalid) {
      safeFocus(firstInvalid);
    }
  }
  
  /**
   * Reset all field states
   */
  reset() {
    this.getFields().forEach(field => {
      this.clearError(field);
      field.classList.remove(this.options.successClass, this.options.errorClass);
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      
      const fieldData = this.fieldRegistry.get(field);
      if (fieldData) {
        fieldData.isValid = null;
        fieldData.lastValue = getFieldValue(field);
      }
    });
  }
  
  /**
   * Destroy DOM manager and clean up
   */
  destroy() {
    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clear health check timer
    if (this.observerHealthCheck) {
      clearInterval(this.observerHealthCheck);
      this.observerHealthCheck = null;
    }

    // Clear periodic scan timer
    if (this.periodicScanInterval) {
      clearInterval(this.periodicScanInterval);
      this.periodicScanInterval = null;
    }

    // Reset all fields
    this.reset();

    // Remove error containers that we created
    this.fieldRegistry.forEach((fieldData, field) => {
      if (fieldData.errorContainer &&
          fieldData.errorContainer.parentNode &&
          !fieldData.config.errorTarget) {
        fieldData.errorContainer.parentNode.removeChild(fieldData.errorContainer);
      }
    });

    // Clear registry
    this.fieldRegistry.clear();
    this.batchedUpdates.clear();
  }
}