/**
 * Accessibility management for FormGuard
 * Handles ARIA attributes, screen reader announcements, and focus management
 */

import { generateId, safeFocus } from './utils.js';

/**
 * AccessibilityManager class for handling accessibility features
 */
export class AccessibilityManager {
  constructor(options = {}) {
    this.options = {
      announceErrors: true,
      announcementDelay: 100,
      liveRegionId: 'formguard-live-region',
      ...options
    };
    
    this.liveRegion = null;
    this.announcementQueue = [];
    this.isProcessingQueue = false;
    
    this.setupLiveRegion();
  }
  
  /**
   * Setup ARIA live region for announcements
   */
  setupLiveRegion() {
    try {
      // Skip if document is not available (test environment)
      if (typeof document === 'undefined') {
        return;
      }

      // Check if live region already exists
      let existingRegion = document.getElementById(this.options.liveRegionId);

      if (existingRegion) {
        this.liveRegion = existingRegion;
        return;
      }

      // Create live region
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = this.options.liveRegionId;
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.className = 'sr-only';

      // Hide visually but keep accessible to screen readers
      this.liveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;

      document.body.appendChild(this.liveRegion);
    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('FormGuard: Failed to setup live region:', error);
      }
      this.liveRegion = null;
    }
  }
  
  /**
   * Set field as invalid with proper ARIA attributes
   * @param {HTMLElement} field - Form field element
   * @param {string} errorMessage - Error message
   * @param {HTMLElement} errorContainer - Error message container
   */
  setInvalid(field, errorMessage, errorContainer) {
    // Set ARIA invalid
    field.setAttribute('aria-invalid', 'true');
    
    // Link to error message
    if (errorContainer && errorContainer.id) {
      field.setAttribute('aria-describedby', errorContainer.id);
    }
    
    // Set required if not already set
    if (!field.hasAttribute('aria-required') && this.isRequiredField(field)) {
      field.setAttribute('aria-required', 'true');
    }
    
    // Announce error if enabled
    if (this.options.announceErrors && errorMessage) {
      this.announceError(field, errorMessage);
    }
  }
  
  /**
   * Set field as valid with proper ARIA attributes
   * @param {HTMLElement} field - Form field element
   */
  setValid(field) {
    // Set ARIA valid
    field.setAttribute('aria-invalid', 'false');
    
    // Remove error description link
    field.removeAttribute('aria-describedby');
    
    // Keep required attribute if field is required
    if (this.isRequiredField(field)) {
      field.setAttribute('aria-required', 'true');
    }
  }
  
  /**
   * Check if field is required
   * @param {HTMLElement} field - Form field element
   * @return {boolean} True if field is required
   */
  isRequiredField(field) {
    const validateAttr = field.getAttribute('data-validate');
    return validateAttr && validateAttr.includes('required');
  }
  
  /**
   * Announce error message to screen readers with enhanced context
   * @param {HTMLElement} field - Form field element
   * @param {string} message - Error message to announce
   * @param {string} priority - Announcement priority ('polite' or 'assertive')
   */
  announceError(field, message, priority = 'assertive') {
    const fieldLabel = this.getFieldLabel(field);
    const fieldType = field.type || 'field';

    // Create contextual announcement
    let context = fieldLabel || field.name || field.id || 'field';

    // Add field type context for better understanding
    if (fieldType === 'checkbox') {
      context = `${context} checkbox`;
    } else if (fieldType === 'radio') {
      context = `${context} radio button`;
    } else if (fieldType === 'select-one' || fieldType === 'select-multiple') {
      context = `${context} dropdown`;
    }

    const announcement = {
      message,
      priority,
      persistent: priority === 'assertive',
      context
    };

    this.queueAnnouncement(announcement);
  }

  /**
   * Announce validation success
   * @param {HTMLElement} field - Form field element
   * @param {string} customMessage - Optional custom success message
   */
  announceSuccess(field, customMessage) {
    const fieldLabel = this.getFieldLabel(field);
    const context = fieldLabel || field.name || field.id || 'field';
    const message = customMessage || 'Valid';

    const announcement = {
      message,
      priority: 'polite',
      context
    };

    this.queueAnnouncement(announcement);
  }

  /**
   * Announce form submission status
   * @param {boolean} isValid - Whether form is valid
   * @param {number} errorCount - Number of errors
   */
  announceFormStatus(isValid, errorCount = 0) {
    let message;
    let priority = 'polite';

    if (isValid) {
      message = 'Form submitted successfully';
    } else {
      message = `Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct.`;
      priority = 'assertive';
    }

    const announcement = {
      message,
      priority,
      persistent: !isValid
    };

    this.queueAnnouncement(announcement);
  }
  
  /**
   * Queue an announcement for screen readers
   * @param {string} message - Message to announce
   */
  queueAnnouncement(message) {
    if (!message || !this.liveRegion) {
      return;
    }

    this.announcementQueue.push(message);

    if (!this.isProcessingQueue) {
      this.processAnnouncementQueue();
    }
  }
  
  /**
   * Process announcement queue with enhanced screen reader support
   */
  async processAnnouncementQueue() {
    if (this.isProcessingQueue || this.announcementQueue.length === 0 || !this.liveRegion) {
      return;
    }

    this.isProcessingQueue = true;

    // Check if user prefers reduced motion/announcements
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    const announceDelay = prefersReducedMotion ? this.options.announcementDelay * 2 : this.options.announcementDelay;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift();

      // Handle different announcement types
      if (typeof announcement === 'object') {
        await this.processStructuredAnnouncement(announcement);
      } else {
        await this.processSimpleAnnouncement(announcement);
      }

      // Adaptive delay based on announcement length and content
      const delay = this.calculateAnnouncementDelay(announcement, announceDelay);
      await this.delay(delay);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Process structured announcement with priority and context
   * @param {Object} announcement - Structured announcement object
   */
  async processStructuredAnnouncement(announcement) {
    if (!this.liveRegion) return;

    const { message, priority = 'polite', persistent = false, context = null } = announcement;

    // Set appropriate aria-live level
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear previous announcement
    this.liveRegion.textContent = '';
    await this.delay(50);

    // Add context if provided
    let fullMessage = message;
    if (context) {
      fullMessage = `${context}: ${message}`;
    }

    // Set new announcement
    if (this.liveRegion) {
      this.liveRegion.textContent = fullMessage;

      // For persistent announcements, repeat after a delay
      if (persistent) {
        setTimeout(() => {
          if (this.liveRegion && this.liveRegion.textContent === fullMessage) {
            this.liveRegion.textContent = '';
            setTimeout(() => {
              if (this.liveRegion) {
                this.liveRegion.textContent = fullMessage;
              }
            }, 100);
          }
        }, 3000);
      }
    }
  }

  /**
   * Process simple string announcement
   * @param {string} announcement - Simple announcement string
   */
  async processSimpleAnnouncement(announcement) {
    if (!this.liveRegion) return;

    // Reset to polite for simple announcements
    this.liveRegion.setAttribute('aria-live', 'polite');

    // Clear previous announcement
    this.liveRegion.textContent = '';
    await this.delay(50);

    // Set new announcement
    this.liveRegion.textContent = announcement;
  }

  /**
   * Calculate appropriate delay for announcement
   * @param {string|Object} announcement - Announcement content
   * @param {number} baseDelay - Base delay time
   * @return {number} Calculated delay
   */
  calculateAnnouncementDelay(announcement, baseDelay) {
    const message = typeof announcement === 'object' ? announcement.message : announcement;
    const messageLength = message.length;

    // Longer messages need more time
    const lengthMultiplier = Math.max(1, messageLength / 50);

    // Priority announcements can be faster
    const priority = typeof announcement === 'object' ? announcement.priority : 'polite';
    const priorityMultiplier = priority === 'assertive' ? 0.8 : 1;

    return Math.max(baseDelay * lengthMultiplier * priorityMultiplier, baseDelay);
  }
  
  /**
   * Get the label text for a field
   * @param {HTMLElement} field - Form field element
   * @return {string} Label text or empty string
   */
  getFieldLabel(field) {
    // Try aria-labelledby first
    const labelledBy = field.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent.trim();
      }
    }
    
    // Try aria-label
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel.trim();
    }
    
    // Try associated label element
    const fieldId = field.id;
    if (fieldId) {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }
    
    // Try parent label
    const parentLabel = field.closest('label');
    if (parentLabel) {
      // Get text content excluding the input itself
      const clone = parentLabel.cloneNode(true);
      const inputs = clone.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.remove());
      return clone.textContent.trim();
    }
    
    // Try placeholder as fallback
    const placeholder = field.getAttribute('placeholder');
    if (placeholder) {
      return placeholder.trim();
    }
    
    // Try name attribute as last resort
    const name = field.getAttribute('name');
    if (name) {
      return name.replace(/[_-]/g, ' ').trim();
    }
    
    return '';
  }
  
  /**
   * Manage focus for form validation
   * @param {HTMLElement} field - Field to focus
   * @param {Object} options - Focus options
   */
  manageFocus(field, options = {}) {
    const { scrollIntoView = true, preventScroll = false } = options;
    
    if (scrollIntoView && !preventScroll) {
      field.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
    
    // Focus with a slight delay to ensure DOM updates are complete
    setTimeout(() => {
      safeFocus(field);
    }, 10);
  }
  
  /**
   * Focus the first invalid field with enhanced viewport awareness and fallback strategies
   * @param {Array} invalidFields - Array of invalid field elements
   * @param {Object} options - Focus options
   */
  focusFirstInvalid(invalidFields, options = {}) {
    if (!invalidFields || invalidFields.length === 0) {
      return;
    }

    // Enhanced field filtering
    const focusableInvalidFields = invalidFields.filter(field => {
      return this.isFocusable(field) && this.isInViewport(field);
    });

    if (focusableInvalidFields.length === 0) {
      // If no focusable fields in viewport, scroll to first invalid
      const firstInvalid = invalidFields[0];
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Try to focus after scroll
        setTimeout(() => {
          if (this.isFocusable(firstInvalid)) {
            this.manageFocus(firstInvalid, options);
          }
        }, 300);
      }
      return;
    }

    const firstFocusable = focusableInvalidFields[0];

    // Store current focus for potential restoration
    const previousFocus = document.activeElement;

    this.manageFocus(firstFocusable, {
      ...options,
      onFocusFail: () => {
        // Fallback focus strategy
        this.fallbackFocus(focusableInvalidFields, previousFocus);
      }
    });

    // Enhanced announcement with context
    if (focusableInvalidFields.length > 1) {
      const remaining = focusableInvalidFields.length - 1;
      const fieldLabel = this.getFieldLabel(firstFocusable) || 'field';
      const announcement = {
        message: `Focused on ${fieldLabel} with error. ${remaining} more error${remaining === 1 ? '' : 's'} to fix.`,
        priority: 'polite'
      };
      this.queueAnnouncement(announcement);
    }
  }

  /**
   * Check if element is focusable
   * @param {HTMLElement} element - Element to check
   * @return {boolean} True if focusable
   */
  isFocusable(element) {
    if (!element || element.disabled || element.hidden) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const tabIndex = element.tabIndex;
    if (tabIndex < 0) return false;

    return true;
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @return {boolean} True if in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Fallback focus strategy when primary focus fails
   * @param {Array} fields - Array of fields to try
   * @param {HTMLElement} previousFocus - Previous focused element
   */
  fallbackFocus(fields, previousFocus) {
    // Try each field in order
    for (const field of fields) {
      try {
        field.focus();
        if (document.activeElement === field) {
          return; // Successfully focused
        }
      } catch (e) {
        continue;
      }
    }

    // If all fails, restore previous focus
    if (previousFocus && this.isFocusable(previousFocus)) {
      try {
        previousFocus.focus();
      } catch (e) {
        // Final fallback - focus form itself
        try {
          const form = fields[0].closest('form');
          if (form) {
            form.focus();
          }
        } catch (e) {
          // Give up gracefully
          if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('FormGuard: All focus attempts failed');
          }
        }
      }
    }
  }
  
  /**
   * Announce form validation summary
   * @param {Object} summary - Validation summary
   */
  announceValidationSummary(summary) {
    const { isValid, errorCount, errors } = summary;
    
    if (isValid) {
      this.queueAnnouncement('Form is valid and ready to submit.');
    } else {
      const errorMessage = errorCount === 1 
        ? '1 error found in form.'
        : `${errorCount} errors found in form.`;
      
      this.queueAnnouncement(errorMessage);
    }
  }
  
  /**
   * Setup keyboard navigation enhancements
   * @param {HTMLFormElement} form - Form element
   */
  setupKeyboardNavigation(form) {
    // Add keyboard event listeners for enhanced navigation
    form.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Enter to submit form
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          submitButton.click();
        }
      }
    });
  }
  
  /**
   * Ensure proper tab order
   * @param {HTMLFormElement} form - Form element
   */
  ensureTabOrder(form) {
    const formElements = form.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button'
    );
    
    formElements.forEach((element, index) => {
      // Only set tabindex if it's not already set
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }
  
  /**
   * Create a delay promise
   * @param {number} ms - Milliseconds to delay
   * @return {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Destroy accessibility manager and clean up
   */
  destroy() {
    // Clear announcement queue
    this.announcementQueue = [];
    this.isProcessingQueue = false;
    
    // Remove live region if we created it
    if (this.liveRegion && this.liveRegion.parentNode) {
      // Only remove if it's our generated one
      if (this.liveRegion.id === this.options.liveRegionId) {
        this.liveRegion.parentNode.removeChild(this.liveRegion);
      }
    }
    
    this.liveRegion = null;
  }
}