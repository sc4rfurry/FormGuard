/**
 * Utility functions for FormGuard
 */

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Debounce delay in milliseconds
 * @return {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function call using requestAnimationFrame
 * @param {Function} func - Function to throttle
 * @return {Function} Throttled function
 */
export function rafThrottle(func) {
  let ticking = false;
  return function throttled(...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * Deep merges two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @return {Object} Merged object
 */
export function mergeDeep(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

/**
 * Checks if a value is an object
 * @param {*} item - Item to check
 * @return {boolean} True if object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Gets a nested property value safely
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path
 * @param {*} defaultValue - Default value if not found
 * @return {*} Value at path or default
 */
export function getNestedValue(obj, path, defaultValue) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

/**
 * Creates a unique ID
 * @param {string} prefix - ID prefix
 * @return {string} Unique ID
 */
export function generateId(prefix = 'fg') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitizes a string for safe DOM insertion
 * @param {string} str - String to sanitize
 * @return {string} Sanitized string
 */
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Checks if an element is visible
 * @param {HTMLElement} element - Element to check
 * @return {boolean} True if visible
 */
export function isVisible(element) {
  return element.offsetWidth > 0 && element.offsetHeight > 0;
}

/**
 * Gets the form field value based on its type
 * @param {HTMLElement} field - Form field element
 * @return {string|boolean|Array} Field value
 */
export function getFieldValue(field) {
  if (!field) return '';
  
  switch (field.type) {
    case 'checkbox':
      return field.checked;
    case 'radio':
      const form = field.closest('form');
      const radioGroup = form ? form.querySelector(`input[name="${field.name}"]:checked`) : null;
      return radioGroup ? radioGroup.value : '';
    case 'file':
      return field.files;
    case 'select-multiple':
      return Array.from(field.selectedOptions).map(option => option.value);
    default:
      return field.value;
  }
}

/**
 * Sets focus on an element safely
 * @param {HTMLElement} element - Element to focus
 */
export function safeFocus(element) {
  if (element && typeof element.focus === 'function' && isVisible(element)) {
    try {
      element.focus();
    } catch (e) {
      // Ignore focus errors (element might not be focusable)
    }
  }
}

/**
 * Parses validation rules from data attribute
 * @param {string} rulesString - Pipe-separated rules string
 * @return {Array} Array of rule objects
 */
export function parseValidationRules(rulesString) {
  if (!rulesString) return [];
  
  return rulesString.split('|').map(rule => {
    const [name, ...paramParts] = rule.split(':');
    const params = paramParts.length > 0 ? paramParts.join(':') : null;
    
    return {
      name: name.trim(),
      params: params ? params.trim() : null
    };
  });
}

/**
 * Creates a custom event with fallback for older browsers
 * @param {string} type - Event type
 * @param {Object} detail - Event detail
 * @return {CustomEvent|Event} Custom event
 */
export function createEvent(type, detail = {}) {
  let event;
  try {
    event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail
    });
  } catch (e) {
    // Fallback for older browsers
    event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, true, true, detail);
  }
  return event;
}

/**
 * Escapes regex special characters
 * @param {string} string - String to escape
 * @return {string} Escaped string
 */
export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if fetch is supported, with XMLHttpRequest fallback
 * @return {boolean} True if HTTP requests are supported
 */
export function isHttpSupported() {
  return typeof fetch !== 'undefined' || typeof XMLHttpRequest !== 'undefined';
}

/**
 * Enhanced HTTP request with timeout, retry, and better error handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
 * @param {number} options.retries - Number of retry attempts (default: 0)
 * @param {number} options.retryDelay - Delay between retries in milliseconds (default: 1000)
 * @return {Promise} Request promise
 */
export function makeRequest(url, options = {}) {
  const {
    timeout = 0, // Default to 0 for backward compatibility
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Use simple request for backward compatibility when no enhanced features requested
  if (timeout === 0 && retries === 0) {
    if (typeof fetch !== 'undefined') {
      return fetch(url, fetchOptions);
    } else {
      return makeRequestWithXHRSimple(url, fetchOptions);
    }
  }

  // Use enhanced request with timeout and retry
  return new Promise(async (resolve, reject) => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (typeof fetch !== 'undefined') {
          const response = await makeRequestWithFetch(url, fetchOptions, timeout);
          resolve(response);
          return;
        } else {
          const response = await makeRequestWithXHR(url, fetchOptions, timeout);
          resolve(response);
          return;
        }
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) or abort errors
        if (error.status >= 400 && error.status < 500) {
          reject(error);
          return;
        }

        if (error.name === 'AbortError') {
          reject(error);
          return;
        }

        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    reject(lastError);
  });
}

/**
 * Make request using fetch API with timeout
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @return {Promise} Response promise
 */
async function makeRequestWithFetch(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Only add signal if not already provided and timeout is enabled
    const fetchOptions = { ...options };
    if (!fetchOptions.signal && timeout > 0) {
      fetchOptions.signal = controller.signal;
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

    // Enhance response object with additional methods
    return {
      ...response,
      json: async () => {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      }
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }

    // Add more context to network errors
    if (error.message === 'Failed to fetch') {
      const networkError = new Error('Network error - please check your connection');
      networkError.name = 'NetworkError';
      networkError.originalError = error;
      throw networkError;
    }

    throw error;
  }
}

/**
 * Simple XMLHttpRequest for backward compatibility
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @return {Promise} Response promise
 */
function makeRequestWithXHRSimple(url, options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', url);

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          ok: true,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText)
        });
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(options.body);
  });
}

/**
 * Make request using XMLHttpRequest with timeout
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {number} timeout - Timeout in milliseconds
 * @return {Promise} Response promise
 */
async function makeRequestWithXHR(url, options, timeout) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeout;

    xhr.open(options.method || 'GET', url);

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.onload = () => {
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        json: () => {
          try {
            return Promise.resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            return Promise.reject(new Error(`Invalid JSON response: ${xhr.responseText.substring(0, 100)}`));
          }
        },
        text: () => Promise.resolve(xhr.responseText)
      };

      resolve(response);
    };

    xhr.onerror = () => {
      const networkError = new Error('Network error - please check your connection');
      networkError.name = 'NetworkError';
      reject(networkError);
    };

    xhr.ontimeout = () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      reject(timeoutError);
    };

    xhr.onabort = () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    };

    try {
      xhr.send(options.body);
    } catch (error) {
      reject(error);
    }
  });
}