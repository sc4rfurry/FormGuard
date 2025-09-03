/**
 * Enhanced FormGuard - Integration with Modern Web APIs (2025)
 * Demonstrates implementation of modern web APIs researched via Context7
 * 
 * New Features:
 * - Constraint Validation API integration
 * - IntersectionObserver for lazy validation
 * - ResizeObserver for responsive error placement
 * - Web Animations API for smooth transitions
 * - View Transition API for state changes
 * - WCAG 2.2 compliance enhancements
 */

import { FormGuard } from './formguard.js';
import { debounce } from './utils.js';

/**
 * Enhanced FormGuard with Modern Web API Integration
 */
export class EnhancedFormGuard extends FormGuard {
  constructor(form, options = {}) {
    // Enhanced default options for 2025
    const enhancedDefaults = {
      // Existing options...
      ...options,
      
      // New modern API options
      useConstraintValidation: true,
      useLazyValidation: true,
      useResponsiveErrorPlacement: true,
      useWebAnimations: true,
      useViewTransitions: true,
      wcag22Compliance: true,
      
      // Enhanced animation options
      animationDuration: 200,
      animationEasing: 'ease-out',
      reduceMotionRespect: true,
      
      // Performance options
      intersectionThreshold: 0.1,
      resizeDebounce: 150
    };
    
    super(form, { ...enhancedDefaults, ...options });
    
    // Initialize modern API components
    this.initializeModernAPIs();
  }
  
  /**
   * Initialize Modern Web APIs
   */
  initializeModernAPIs() {
    this.initializeConstraintValidation();
    this.initializeLazyValidation();
    this.initializeResponsiveErrorPlacement();
    this.initializeWebAnimations();
    this.initializeWCAG22Features();
  }
  
  /**
   * Integrate Constraint Validation API
   */
  initializeConstraintValidation() {
    if (!this.options.useConstraintValidation) return;
    
    // Enhance native validation with custom messages
    this.constraintValidator = {
      setCustomMessages: (field, validators) => {
        validators.forEach(validator => {
          if (validator.name === 'required' && field.required !== undefined) {
            field.setCustomValidity('');
          }
        });
      },
      
      checkNativeValidity: (field) => {
        if (!field.validity) return { valid: true };
        
        const validity = field.validity;
        
        if (!validity.valid) {
          return {
            valid: false,
            message: this.getConstraintValidationMessage(field, validity)
          };
        }
        
        return { valid: true };
      },
      
      getConstraintValidationMessage: (field, validity) => {
        // Map native validation states to custom messages
        if (validity.valueMissing) return field.dataset.errorRequired || 'This field is required';
        if (validity.typeMismatch) return field.dataset.errorType || field.validationMessage;
        if (validity.patternMismatch) return field.dataset.errorPattern || 'Please match the required format';
        if (validity.tooLong) return field.dataset.errorMaxlength || `Maximum ${field.maxLength} characters allowed`;
        if (validity.tooShort) return field.dataset.errorMinlength || `Minimum ${field.minLength} characters required`;
        if (validity.rangeOverflow) return field.dataset.errorMax || `Value must be ${field.max} or less`;
        if (validity.rangeUnderflow) return field.dataset.errorMin || `Value must be ${field.min} or greater`;
        if (validity.stepMismatch) return field.dataset.errorStep || 'Value is not valid';
        
        return field.validationMessage || 'Please enter a valid value';
      }
    };
  }
  
  /**
   * Initialize Lazy Validation with IntersectionObserver
   */
  initializeLazyValidation() {
    if (!this.options.useLazyValidation || !window.IntersectionObserver) return;
    
    this.lazyValidator = {
      observer: null,
      pendingFields: new Set(),
      
      init: () => {
        this.lazyValidator.observer = new IntersectionObserver(
          this.lazyValidator.handleIntersection,
          {
            threshold: this.options.intersectionThreshold,
            rootMargin: '50px'
          }
        );
      },
      
      observeField: (field) => {
        if (this.lazyValidator.observer && !field.dataset.lazyObserved) {
          this.lazyValidator.observer.observe(field);
          this.lazyValidator.pendingFields.add(field);
          field.dataset.lazyObserved = 'true';
        }
      },
      
      handleIntersection: (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.lazyValidator.pendingFields.has(entry.target)) {
            // Field is now visible, initialize full validation
            this.attachFieldListeners(entry.target);
            this.lazyValidator.pendingFields.delete(entry.target);
            this.lazyValidator.observer.unobserve(entry.target);
          }
        });
      }
    };
    
    this.lazyValidator.init();
    
    // Override attachFieldListeners to use lazy loading for off-screen fields
    const originalAttachFieldListeners = this.attachFieldListeners.bind(this);
    this.attachFieldListeners = (field) => {
      // Check if field is in viewport
      const rect = field.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      );
      
      if (isVisible) {
        originalAttachFieldListeners(field);
      } else {
        this.lazyValidator.observeField(field);
      }
    };
  }
  
  /**
   * Initialize Responsive Error Placement with ResizeObserver
   */
  initializeResponsiveErrorPlacement() {
    if (!this.options.useResponsiveErrorPlacement || !window.ResizeObserver) return;
    
    this.responsiveManager = {
      observer: null,
      fieldObservers: new Map(),
      
      init: () => {
        this.responsiveManager.observer = new ResizeObserver(
          debounce(this.responsiveManager.handleResize, this.options.resizeDebounce)
        );
        
        // Observe the form container
        this.responsiveManager.observer.observe(this.form);
      },
      
      handleResize: (entries) => {
        entries.forEach(entry => {
          const { width } = entry.contentRect;
          
          // Adjust error placement based on container width
          this.adjustErrorPlacement(width);
        });
      },
      
      adjustErrorPlacement: (containerWidth) => {
        const errorElements = this.form.querySelectorAll('.error-message');
        
        errorElements.forEach(errorEl => {
          const field = errorEl.previousElementSibling;
          if (!field) return;
          
          const fieldRect = field.getBoundingClientRect();
          
          // Dynamic placement logic based on available space
          if (containerWidth < 480) { // Mobile
            errorEl.className = 'error-message error-placement-below';
          } else if (containerWidth < 768) { // Tablet
            errorEl.className = 'error-message error-placement-inline';
          } else { // Desktop
            // Check if there's space to the right
            const spaceRight = containerWidth - (fieldRect.right - this.form.getBoundingClientRect().left);
            if (spaceRight > 200) {
              errorEl.className = 'error-message error-placement-right';
            } else {
              errorEl.className = 'error-message error-placement-below';
            }
          }
        });
      }
    };
    
    this.responsiveManager.init();
  }
  
  /**
   * Initialize Web Animations API for Smooth Transitions
   */
  initializeWebAnimations() {
    if (!this.options.useWebAnimations || !window.Element.prototype.animate) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = !prefersReducedMotion || !this.options.reduceMotionRespect;
    
    this.animationManager = {
      showError: (errorElement, field) => {
        if (!shouldAnimate) {
          errorElement.style.opacity = '1';
          return Promise.resolve();
        }
        
        const animation = errorElement.animate([
          { 
            opacity: 0, 
            transform: 'translateY(-10px)', 
            maxHeight: '0px' 
          },
          { 
            opacity: 1, 
            transform: 'translateY(0px)', 
            maxHeight: '100px' 
          }
        ], {
          duration: this.options.animationDuration,
          easing: this.options.animationEasing,
          fill: 'forwards'
        });
        
        return animation.finished;
      },
      
      hideError: (errorElement) => {
        if (!shouldAnimate) {
          errorElement.style.opacity = '0';
          return Promise.resolve();
        }
        
        const animation = errorElement.animate([
          { 
            opacity: 1, 
            transform: 'translateY(0px)', 
            maxHeight: '100px' 
          },
          { 
            opacity: 0, 
            transform: 'translateY(-10px)', 
            maxHeight: '0px' 
          }
        ], {
          duration: this.options.animationDuration,
          easing: this.options.animationEasing,
          fill: 'forwards'
        });
        
        return animation.finished;
      },
      
      highlightField: (field, isError = true) => {
        if (!shouldAnimate) return Promise.resolve();
        
        const keyframes = isError ? [
          { borderColor: field.style.borderColor || '#ccc' },
          { borderColor: '#dc3545' },
          { borderColor: '#dc3545' }
        ] : [
          { borderColor: field.style.borderColor || '#ccc' },
          { borderColor: '#28a745' },
          { borderColor: '#28a745' }
        ];
        
        const animation = field.animate(keyframes, {
          duration: this.options.animationDuration,
          easing: this.options.animationEasing,
          fill: 'forwards'
        });
        
        return animation.finished;
      }
    };
    
    // Override DOM manager methods to use animations
    const originalDisplayError = this.domManager.displayError.bind(this.domManager);
    this.domManager.displayError = async (field, message) => {
      originalDisplayError(field, message);
      
      const errorElement = field.parentNode.querySelector('.error-message');
      if (errorElement) {
        await this.animationManager.showError(errorElement, field);
        await this.animationManager.highlightField(field, true);
      }
    };
    
    const originalClearError = this.domManager.clearError.bind(this.domManager);
    this.domManager.clearError = async (field) => {
      const errorElement = field.parentNode.querySelector('.error-message');
      if (errorElement) {
        await this.animationManager.hideError(errorElement);
      }
      
      originalClearError(field);
      await this.animationManager.highlightField(field, false);
    };
  }
  
  /**
   * Initialize View Transition API for State Changes
   */
  initializeViewTransitions() {
    if (!this.options.useViewTransitions || !document.startViewTransition) return;
    
    this.viewTransitionManager = {
      transitionFormState: async (updateCallback) => {
        if (!document.startViewTransition) {
          updateCallback();
          return;
        }
        
        return document.startViewTransition(updateCallback);
      }
    };
    
    // Use View Transitions for form reset
    const originalReset = this.reset.bind(this);
    this.reset = async () => {
      if (this.viewTransitionManager) {
        await this.viewTransitionManager.transitionFormState(() => {
          originalReset();
        });
      } else {
        originalReset();
      }
    };
  }
  
  /**
   * Initialize WCAG 2.2 Compliance Features
   */
  initializeWCAG22Features() {
    if (!this.options.wcag22Compliance) return;
    
    this.wcag22Manager = {
      enhanceFocusIndicators: () => {
        // Add enhanced focus indicators for WCAG 2.2
        const style = document.createElement('style');
        style.textContent = `
          .formguard-enhanced input:focus,
          .formguard-enhanced select:focus,
          .formguard-enhanced textarea:focus {
            outline: 2px solid #005fcc;
            outline-offset: 2px;
            border-radius: 2px;
          }
          
          .formguard-enhanced input:focus-visible,
          .formguard-enhanced select:focus-visible,
          .formguard-enhanced textarea:focus-visible {
            outline: 2px solid #005fcc;
            outline-offset: 2px;
          }
          
          /* High contrast mode support */
          @media (forced-colors: active) {
            .formguard-enhanced input:focus,
            .formguard-enhanced select:focus,
            .formguard-enhanced textarea:focus {
              outline: 2px solid ButtonText;
            }
          }
        `;
        document.head.appendChild(style);
        
        // Add class to form for enhanced styling
        this.form.classList.add('formguard-enhanced');
      },
      
      ensureTargetSize: () => {
        // Ensure interactive elements meet 24x24px minimum
        const interactiveElements = this.form.querySelectorAll(
          'input[type="submit"], input[type="button"], button, input[type="checkbox"], input[type="radio"]'
        );
        
        interactiveElements.forEach(element => {
          const computed = window.getComputedStyle(element);
          const width = parseInt(computed.width);
          const height = parseInt(computed.height);
          
          if (width < 24 || height < 24) {
            element.style.minWidth = '24px';
            element.style.minHeight = '24px';
            element.style.padding = Math.max(0, (24 - Math.min(width, height)) / 2) + 'px';
          }
        });
      },
      
      provideDragAlternatives: () => {
        // Ensure all drag interactions have keyboard/click alternatives
        const draggableElements = this.form.querySelectorAll('[draggable="true"]');
        
        draggableElements.forEach(element => {
          if (!element.getAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
          }
          
          if (!element.getAttribute('role')) {
            element.setAttribute('role', 'button');
          }
          
          // Add keyboard support for drag operations
          element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              // Trigger alternative action instead of drag
              const alternativeButton = element.querySelector('.drag-alternative') ||
                                       element.parentNode.querySelector('.drag-alternative');
              if (alternativeButton) {
                alternativeButton.click();
              }
            }
          });
        });
      }
    };
    
    // Initialize WCAG 2.2 features
    this.wcag22Manager.enhanceFocusIndicators();
    this.wcag22Manager.ensureTargetSize();
    this.wcag22Manager.provideDragAlternatives();
  }
  
  /**
   * Enhanced validation that includes Constraint Validation API
   */
  async validateField(field) {
    if (!field || this.isDestroyed) return true;
    
    // First check native constraint validation
    if (this.options.useConstraintValidation && this.constraintValidator) {
      const nativeResult = this.constraintValidator.checkNativeValidity(field);
      if (!nativeResult.valid) {
        this.setFieldError(field, nativeResult.message);
        return false;
      }
    }
    
    // Then run custom validation
    return await super.validateField(field);
  }
  
  /**
   * Destroy method enhanced with modern API cleanup
   */
  destroy() {
    // Clean up modern API observers
    if (this.lazyValidator?.observer) {
      this.lazyValidator.observer.disconnect();
    }
    
    if (this.responsiveManager?.observer) {
      this.responsiveManager.observer.disconnect();
    }
    
    // Call parent destroy
    super.destroy();
  }
  
  /**
   * Static method to create enhanced instances with automatic feature detection
   */
  static createWithFeatureDetection(form, options = {}) {
    // Auto-detect available APIs and adjust options
    const detectedFeatures = {
      useConstraintValidation: 'validity' in document.createElement('input'),
      useLazyValidation: 'IntersectionObserver' in window,
      useResponsiveErrorPlacement: 'ResizeObserver' in window,
      useWebAnimations: 'animate' in document.createElement('div'),
      useViewTransitions: 'startViewTransition' in document,
      wcag22Compliance: true // Always enable WCAG 2.2 features
    };
    
    const enhancedOptions = { ...detectedFeatures, ...options };
    
    return new EnhancedFormGuard(form, enhancedOptions);
  }
}

/**
 * Auto-initialize enhanced FormGuard with feature detection
 */
export function autoInitializeEnhanced(selector = 'form[data-enhanced-formguard]', options = {}) {
  const forms = document.querySelectorAll(selector);
  const instances = [];
  
  forms.forEach(form => {
    try {
      instances.push(EnhancedFormGuard.createWithFeatureDetection(form, options));
    } catch (error) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('Enhanced FormGuard initialization failed:', error);
      }
      // Fallback to regular FormGuard
      instances.push(new FormGuard(form, options));
    }
  });
  
  return instances;
}

// Export for both ES modules and global usage
if (typeof window !== 'undefined') {
  window.EnhancedFormGuard = EnhancedFormGuard;
  window.autoInitializeEnhanced = autoInitializeEnhanced;
}