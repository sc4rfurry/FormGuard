/**
 * Jest test setup file
 */

// Mock fetch for async validator tests
global.fetch = jest.fn();

// Mock console methods to avoid test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock window.matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'en-US',
    userLanguage: 'en-US',
    languages: ['en-US', 'en']
  },
  writable: true,
});

// Setup DOM environment
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn(cb => setTimeout(cb, 0))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn(id => clearTimeout(id))
});

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    // Mock implementation
  }

  disconnect() {
    // Mock implementation
  }
};

// Mock AbortController
global.AbortController = class AbortController {
  constructor() {
    this.signal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  }

  abort() {
    this.signal.aborted = true;
  }
};

// Mock XMLHttpRequest
global.XMLHttpRequest = class XMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 200;
    this.statusText = 'OK';
    this.responseText = '';
    this.timeout = 0;
    this.onload = null;
    this.onerror = null;
    this.ontimeout = null;
    this.onabort = null;
  }

  open(method, url) {
    this.method = method;
    this.url = url;
    this.readyState = 1;
  }

  setRequestHeader(name, value) {
    this.headers = this.headers || {};
    this.headers[name] = value;
  }

  send(data) {
    this.data = data;
    this.readyState = 4;

    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  abort() {
    if (this.onabort) {
      this.onabort();
    }
  }
};

// Test cleanup
beforeEach(() => {
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }

  // Reset console mocks
  if (global.console.log && global.console.log.mockClear) {
    global.console.log.mockClear();
    global.console.warn.mockClear();
    global.console.error.mockClear();
  }

  // Reset window state
  if (global.window) {
    global.window.FormGuardStrictMode = false;
  }

  // Reset localStorage mock
  if (global.localStorage) {
    global.localStorage.getItem.mockReturnValue(null);
    if (global.localStorage.setItem && global.localStorage.setItem.mockClear) {
      global.localStorage.setItem.mockClear();
    }
    if (global.localStorage.removeItem && global.localStorage.removeItem.mockClear) {
      global.localStorage.removeItem.mockClear();
    }
    if (global.localStorage.clear && global.localStorage.clear.mockClear) {
      global.localStorage.clear.mockClear();
    }
  }

  // Reset document state
  if (global.document) {
    // activeElement is read-only, so we can't set it directly
    // Just ensure it's properly mocked
    try {
      Object.defineProperty(global.document, 'activeElement', {
        value: null,
        writable: true,
        configurable: true
      });
    } catch (e) {
      // Ignore if already defined
    }
  }
});

afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();

  // Clean up any FormGuard instances
  if (typeof FormGuard !== 'undefined' && FormGuard.instances) {
    FormGuard.instances.forEach(instance => {
      try {
        instance.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    FormGuard.instances.length = 0;
  }
});

// Helper function to create a test form
global.createTestForm = (html = '') => {
  const form = document.createElement('form');

  // Use a more robust method to create DOM elements
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html.trim();

  // Move all child nodes from temp div to form
  while (tempDiv.firstChild) {
    form.appendChild(tempDiv.firstChild);
  }

  document.body.appendChild(form);

  // Verify elements were created
  const expectedElements = html.match(/name="([^"]+)"/g);
  if (expectedElements) {
    expectedElements.forEach(match => {
      const name = match.match(/name="([^"]+)"/)[1];
      const element = form.querySelector(`[name="${name}"]`);
      if (!element) {
        throw new Error(`Failed to create element with name="${name}"`);
      }
    });
  }

  return form;
};

// Helper function to clean up DOM
global.cleanupDOM = () => {
  document.body.innerHTML = '';
};

// Mock CustomEvent for older browser support
if (!global.CustomEvent) {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.detail = eventInitDict.detail;
    }
  };
}

// Cleanup after each test
afterEach(() => {
  cleanupDOM();
  jest.clearAllMocks();
});