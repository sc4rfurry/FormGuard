/**
 * Internationalization (i18n) support for FormGuard
 */

/**
 * Default error messages in English
 */
const defaultMessages = {
  en: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    min: 'Must be at least {0} characters',
    max: 'Must be no more than {0} characters',
    minValue: 'Must be at least {0}',
    maxValue: 'Must be no more than {0}',
    pattern: 'Please match the required format',
    match: 'Fields do not match',
    url: 'Please enter a valid URL',
    number: 'Please enter a valid number',
    integer: 'Please enter a whole number',
    date: 'Please enter a valid date',
    creditcard: 'Please enter a valid credit card number',
    phone: 'Please enter a valid phone number',
    remote: 'Invalid value',
    unique: 'This value is already taken',
    
    // File validation messages
    fileRequired: 'Please select a file',
    
    // Checkbox/radio messages
    checkboxRequired: 'This field is required',
    radioRequired: 'Please select an option',
    selectRequired: 'Please select at least one option',
    
    // Generic messages
    validationError: 'Validation error occurred',
    invalidField: 'Invalid {0}',
    
    // Accessibility messages
    errorAnnouncement: 'Error: {0}',
    validAnnouncement: 'Valid',
    formInvalid: 'Form has {0} error(s)',
    formValid: 'Form is valid'
  }
};

/**
 * Additional language packs
 */
const languagePacks = {
  es: {
    required: 'Este campo es obligatorio',
    email: 'Por favor ingrese una dirección de email válida',
    min: 'Debe tener al menos {0} caracteres',
    max: 'No debe tener más de {0} caracteres',
    minValue: 'Debe ser al menos {0}',
    maxValue: 'No debe ser más de {0}',
    pattern: 'Por favor coincida con el formato requerido',
    match: 'Los campos no coinciden',
    url: 'Por favor ingrese una URL válida',
    number: 'Por favor ingrese un número válido',
    integer: 'Por favor ingrese un número entero',
    date: 'Por favor ingrese una fecha válida',
    creditcard: 'Por favor ingrese un número de tarjeta de crédito válido',
    phone: 'Por favor ingrese un número de teléfono válido',
    remote: 'Valor inválido',
    unique: 'Este valor ya está en uso',
    fileRequired: 'Por favor seleccione un archivo',
    checkboxRequired: 'Este campo es obligatorio',
    radioRequired: 'Por favor seleccione una opción',
    selectRequired: 'Por favor seleccione al menos una opción',
    validationError: 'Ocurrió un error de validación',
    invalidField: '{0} inválido',
    errorAnnouncement: 'Error: {0}',
    validAnnouncement: 'Válido',
    formInvalid: 'El formulario tiene {0} error(es)',
    formValid: 'El formulario es válido'
  },
  
  fr: {
    required: 'Ce champ est requis',
    email: 'Veuillez saisir une adresse email valide',
    min: 'Doit contenir au moins {0} caractères',
    max: 'Ne doit pas dépasser {0} caractères',
    minValue: 'Doit être au moins {0}',
    maxValue: 'Ne doit pas dépasser {0}',
    pattern: 'Veuillez respecter le format requis',
    match: 'Les champs ne correspondent pas',
    url: 'Veuillez saisir une URL valide',
    number: 'Veuillez saisir un nombre valide',
    integer: 'Veuillez saisir un nombre entier',
    date: 'Veuillez saisir une date valide',
    creditcard: 'Veuillez saisir un numéro de carte de crédit valide',
    phone: 'Veuillez saisir un numéro de téléphone valide',
    remote: 'Valeur invalide',
    unique: 'Cette valeur est déjà utilisée',
    fileRequired: 'Veuillez sélectionner un fichier',
    checkboxRequired: 'Ce champ est requis',
    radioRequired: 'Veuillez sélectionner une option',
    selectRequired: 'Veuillez sélectionner au moins une option',
    validationError: 'Une erreur de validation s\'est produite',
    invalidField: '{0} invalide',
    errorAnnouncement: 'Erreur: {0}',
    validAnnouncement: 'Valide',
    formInvalid: 'Le formulaire contient {0} erreur(s)',
    formValid: 'Le formulaire est valide'
  },
  
  de: {
    required: 'Dieses Feld ist erforderlich',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    min: 'Muss mindestens {0} Zeichen haben',
    max: 'Darf höchstens {0} Zeichen haben',
    minValue: 'Muss mindestens {0} sein',
    maxValue: 'Darf höchstens {0} sein',
    pattern: 'Bitte entsprechen Sie dem erforderlichen Format',
    match: 'Felder stimmen nicht überein',
    url: 'Bitte geben Sie eine gültige URL ein',
    number: 'Bitte geben Sie eine gültige Zahl ein',
    integer: 'Bitte geben Sie eine ganze Zahl ein',
    date: 'Bitte geben Sie ein gültiges Datum ein',
    creditcard: 'Bitte geben Sie eine gültige Kreditkartennummer ein',
    phone: 'Bitte geben Sie eine gültige Telefonnummer ein',
    remote: 'Ungültiger Wert',
    unique: 'Dieser Wert wird bereits verwendet',
    fileRequired: 'Bitte wählen Sie eine Datei aus',
    checkboxRequired: 'Dieses Feld ist erforderlich',
    radioRequired: 'Bitte wählen Sie eine Option aus',
    selectRequired: 'Bitte wählen Sie mindestens eine Option aus',
    validationError: 'Ein Validierungsfehler ist aufgetreten',
    invalidField: 'Ungültiges {0}',
    errorAnnouncement: 'Fehler: {0}',
    validAnnouncement: 'Gültig',
    formInvalid: 'Das Formular hat {0} Fehler',
    formValid: 'Das Formular ist gültig'
  }
};

/**
 * I18n class for managing internationalization
 */
export class I18n {
  constructor(options = {}) {
    this.currentLanguage = options.language || this.detectLanguage();
    this.fallbackLanguage = options.fallbackLanguage || 'en';
    this.messages = { ...defaultMessages };
    
    // Load additional language packs
    Object.entries(languagePacks).forEach(([lang, messages]) => {
      this.messages[lang] = messages;
    });
    
    // Load custom messages if provided
    if (options.messages) {
      this.addMessages(options.messages);
    }
  }
  
  /**
   * Enhanced language detection with fallback chain
   * @return {string} Detected language code
   */
  detectLanguage() {
    // Try multiple sources for language detection
    const sources = [
      () => this.getStoredLanguage(),
      () => typeof document !== 'undefined' ? document.documentElement?.lang : null,
      () => typeof navigator !== 'undefined' ? navigator.language : null,
      () => typeof navigator !== 'undefined' ? navigator.userLanguage : null,
      () => typeof navigator !== 'undefined' ? navigator.languages?.[0] : null
    ];

    for (const source of sources) {
      try {
        const lang = source();
        if (lang) {
          const normalizedLang = this.normalizeLanguageCode(lang);
          if (this.isLanguageSupported(normalizedLang)) {
            return normalizedLang;
          }

          // Try base language if regional variant not supported
          const baseLang = normalizedLang.split('-')[0];
          if (this.isLanguageSupported(baseLang)) {
            return baseLang;
          }
        }
      } catch (e) {
        continue;
      }
    }

    return 'en'; // Final fallback
  }

  /**
   * Get stored language preference
   * @return {string|null} Stored language or null
   */
  getStoredLanguage() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('formguard-language');
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return null;
  }

  /**
   * Normalize language code to standard format
   * @param {string} lang - Language code to normalize
   * @return {string} Normalized language code
   */
  normalizeLanguageCode(lang) {
    if (!lang) return 'en';

    // Handle common variations
    const normalized = lang.toLowerCase().replace('_', '-');

    // Map common language codes
    const languageMap = {
      'zh-cn': 'zh',
      'zh-tw': 'zh',
      'pt-br': 'pt',
      'en-us': 'en',
      'en-gb': 'en'
    };

    return languageMap[normalized] || normalized.split('-')[0];
  }
  
  /**
   * Set current language with persistence and validation
   * @param {string} language - Language code
   */
  setLanguage(language) {
    const normalizedLang = this.normalizeLanguageCode(language);

    if (!this.isLanguageSupported(normalizedLang)) {
      console.warn(`FormGuard: Language "${language}" not supported, falling back to ${this.fallbackLanguage}`);
      this.currentLanguage = this.fallbackLanguage;
    } else {
      this.currentLanguage = normalizedLang;
    }

    // Persist user preference
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('formguard-language', this.currentLanguage);
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Dispatch language change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('formguard:languagechange', {
        detail: { language: this.currentLanguage }
      }));
    }
  }
  
  /**
   * Get current language
   * @return {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Add custom messages for a language
   * @param {string} language - Language code
   * @param {Object} messages - Message object
   */
  addMessages(language, messages) {
    if (typeof language === 'object') {
      // If first parameter is an object, treat it as messages for multiple languages
      Object.entries(language).forEach(([lang, msgs]) => {
        if (!this.messages[lang]) {
          this.messages[lang] = {};
        }
        Object.assign(this.messages[lang], msgs);
      });
    } else {
      // Single language
      if (!this.messages[language]) {
        this.messages[language] = {};
      }
      Object.assign(this.messages[language], messages);
    }
  }
  
  /**
   * Get translated message
   * @param {string} key - Message key
   * @param {...any} params - Parameters for message interpolation
   * @return {string} Translated message
   */
  t(key, ...params) {
    let message = this.getMessage(key, this.currentLanguage);
    
    // Fallback to default language if not found
    if (!message && this.currentLanguage !== this.fallbackLanguage) {
      message = this.getMessage(key, this.fallbackLanguage);
    }
    
    // Final fallback to key itself
    if (!message) {
      message = key;
    }
    
    // Interpolate parameters
    return this.interpolate(message, params);
  }
  
  /**
   * Get message for specific language
   * @param {string} key - Message key
   * @param {string} language - Language code
   * @return {string|null} Message or null if not found
   */
  getMessage(key, language) {
    const languageMessages = this.messages[language];
    return languageMessages ? languageMessages[key] : null;
  }
  
  /**
   * Interpolate parameters into message
   * @param {string} message - Message template
   * @param {Array} params - Parameters to interpolate
   * @return {string} Interpolated message
   */
  interpolate(message, params) {
    if (!params || params.length === 0) {
      return message;
    }
    
    return message.replace(/\{(\d+)\}/g, (match, index) => {
      const paramIndex = parseInt(index, 10);
      return params[paramIndex] !== undefined ? String(params[paramIndex]) : match;
    });
  }
  
  /**
   * Get available languages
   * @return {Array} Array of language codes
   */
  getAvailableLanguages() {
    return Object.keys(this.messages);
  }
  
  /**
   * Check if language is supported
   * @param {string} language - Language code
   * @return {boolean} True if supported
   */
  isLanguageSupported(language) {
    return this.messages.hasOwnProperty(language);
  }
}

// Create default instance
export const i18n = new I18n();

// Export language packs for external use
export { defaultMessages, languagePacks };
