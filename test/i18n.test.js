/**
 * Tests for i18n functionality
 */

import { I18n, i18n } from '../src/i18n.js';

describe('I18n', () => {
  let i18nInstance;
  
  beforeEach(() => {
    i18nInstance = new I18n();
  });

  describe('Language Detection and Setting', () => {
    test('should detect browser language', () => {
      const originalNavigator = global.navigator;
      const originalLocalStorage = global.localStorage;

      // Mock localStorage to return null (no stored language)
      global.localStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };

      global.navigator = { language: 'es-ES' };

      const instance = new I18n();
      expect(instance.getLanguage()).toBe('es');

      global.navigator = originalNavigator;
      global.localStorage = originalLocalStorage;
    });

    test('should fallback to English when no navigator', () => {
      const originalNavigator = global.navigator;
      delete global.navigator;
      
      const instance = new I18n();
      expect(instance.getLanguage()).toBe('en');
      
      global.navigator = originalNavigator;
    });

    test('should set and get language', () => {
      i18nInstance.setLanguage('fr');
      expect(i18nInstance.getLanguage()).toBe('fr');
    });

    test('should use provided language in constructor', () => {
      const instance = new I18n({ language: 'de' });
      expect(instance.getLanguage()).toBe('de');
    });
  });

  describe('Message Translation', () => {
    test('should translate basic messages', () => {
      expect(i18nInstance.t('required')).toBe('This field is required');
      expect(i18nInstance.t('email')).toBe('Please enter a valid email address');
    });

    test('should translate messages with parameters', () => {
      expect(i18nInstance.t('min', '5')).toBe('Must be at least 5 characters');
      expect(i18nInstance.t('max', '100')).toBe('Must be no more than 100 characters');
    });

    test('should translate to different languages', () => {
      i18nInstance.setLanguage('es');
      expect(i18nInstance.t('required')).toBe('Este campo es obligatorio');
      expect(i18nInstance.t('email')).toBe('Por favor ingrese una dirección de email válida');
    });

    test('should fallback to English when translation not found', () => {
      i18nInstance.setLanguage('nonexistent');
      expect(i18nInstance.t('required')).toBe('This field is required');
    });

    test('should return key when no translation found', () => {
      expect(i18nInstance.t('nonexistentKey')).toBe('nonexistentKey');
    });
  });

  describe('Custom Messages', () => {
    test('should add custom messages for single language', () => {
      i18nInstance.addMessages('en', {
        customMessage: 'This is a custom message'
      });
      
      expect(i18nInstance.t('customMessage')).toBe('This is a custom message');
    });

    test('should add custom messages for multiple languages', () => {
      i18nInstance.addMessages({
        en: { customMessage: 'Custom in English' },
        es: { customMessage: 'Personalizado en español' }
      });
      
      expect(i18nInstance.t('customMessage')).toBe('Custom in English');
      
      i18nInstance.setLanguage('es');
      expect(i18nInstance.t('customMessage')).toBe('Personalizado en español');
    });

    test('should override existing messages', () => {
      i18nInstance.addMessages('en', {
        required: 'This field is absolutely required'
      });
      
      expect(i18nInstance.t('required')).toBe('This field is absolutely required');
    });
  });

  describe('Parameter Interpolation', () => {
    test('should interpolate single parameter', () => {
      i18nInstance.addMessages('en', {
        testMessage: 'Hello {0}'
      });
      
      expect(i18nInstance.t('testMessage', 'World')).toBe('Hello World');
    });

    test('should interpolate multiple parameters', () => {
      i18nInstance.addMessages('en', {
        testMessage: '{0} has {1} items'
      });
      
      expect(i18nInstance.t('testMessage', 'Cart', '5')).toBe('Cart has 5 items');
    });

    test('should handle missing parameters', () => {
      i18nInstance.addMessages('en', {
        testMessage: 'Hello {0} and {1}'
      });
      
      expect(i18nInstance.t('testMessage', 'World')).toBe('Hello World and {1}');
    });

    test('should handle extra parameters', () => {
      i18nInstance.addMessages('en', {
        testMessage: 'Hello {0}'
      });
      
      expect(i18nInstance.t('testMessage', 'World', 'Extra')).toBe('Hello World');
    });
  });

  describe('Language Support', () => {
    test('should return available languages', () => {
      const languages = i18nInstance.getAvailableLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
      expect(languages).toContain('de');
    });

    test('should check if language is supported', () => {
      expect(i18nInstance.isLanguageSupported('en')).toBe(true);
      expect(i18nInstance.isLanguageSupported('es')).toBe(true);
      expect(i18nInstance.isLanguageSupported('nonexistent')).toBe(false);
    });
  });

  describe('Constructor Options', () => {
    test('should accept custom messages in constructor', () => {
      const instance = new I18n({
        language: 'en',
        messages: {
          en: { customMessage: 'Constructor message' }
        }
      });
      
      expect(instance.t('customMessage')).toBe('Constructor message');
    });

    test('should set fallback language', () => {
      const instance = new I18n({
        language: 'nonexistent',
        fallbackLanguage: 'es'
      });
      
      expect(instance.t('required')).toBe('Este campo es obligatorio');
    });
  });
});

describe('Global i18n instance', () => {
  test('should be available as singleton', () => {
    expect(i18n).toBeInstanceOf(I18n);
  });

  test('should have default language', () => {
    expect(typeof i18n.getLanguage()).toBe('string');
  });

  test('should translate messages', () => {
    // Create a fresh instance to avoid interference from other tests
    const freshI18n = new I18n({ language: 'en' });
    expect(freshI18n.t('required')).toBe('This field is required');
  });
});
