// Type definitions for FormGuard
// Project: FormGuard
// Definitions by: FormGuard Contributors

export interface FormGuardOptions {
  validateOn?: 'blur' | 'input' | 'submit' | 'manual';
  debounce?: number;
  errorClass?: string;
  successClass?: string;
  errorPlacement?: 'after' | 'before' | 'append' | 'custom';
  errorTemplate?: string;
  customValidators?: Record<string, ValidatorFunction>;
  messages?: Record<string, string>;
  focusInvalid?: boolean;
  preventSubmit?: boolean;
  announceErrors?: boolean;
  liveValidation?: boolean;
  submitValidation?: boolean;
  resetOnSubmit?: boolean;
  useNativeValidation?: boolean;
  maxStateEntries?: number;
  stateCleanupInterval?: number;
  maxAsyncPromises?: number;
  i18n?: {
    language?: string | null;
    fallbackLanguage?: string;
    messages?: Record<string, Record<string, string>>;
  };
}

export type ValidatorResult = boolean | string | Promise<boolean | string>;

export interface ValidatorFunction {
  (value: any, params?: string, field?: HTMLElement): ValidatorResult;
}

export interface ValidationRule {
  name: string;
  params: string | null;
}

export interface ValidationState {
  isValid: boolean;
  message: string | null;
}

export interface FormGuardEvent extends CustomEvent {
  detail: {
    form?: HTMLFormElement;
    field?: HTMLElement;
    value?: any;
    errors?: string[] | Record<string, string>;
    valid?: boolean;
    options?: FormGuardOptions;
  };
}

export declare class ValidatorRegistry {
  constructor();
  
  register(name: string, validator: ValidatorFunction): void;
  get(name: string): ValidatorFunction | null;
  has(name: string): boolean;
  remove(name: string): boolean;
  getCacheKey(validatorName: string, value: string, params: string): string;
  getFromCache(key: string): any;
  setCache(key: string, result: any): void;
  clearCache(): void;
}

export declare class DOMManager {
  constructor(options?: Partial<FormGuardOptions>);
  
  initialize(form: HTMLFormElement): void;
  attachField(field: HTMLElement): void;
  detachField(field: HTMLElement): void;
  displayError(field: HTMLElement, message: string): void;
  clearError(field: HTMLElement): void;
  markValid(field: HTMLElement): void;
  getFields(): HTMLElement[];
  getFieldConfig(field: HTMLElement): any;
  hasFieldChanged(field: HTMLElement): boolean;
  focusFirstInvalid(): void;
  reset(): void;
  destroy(): void;
}

export declare class AccessibilityManager {
  constructor(options?: Partial<FormGuardOptions>);
  
  setInvalid(field: HTMLElement, errorMessage: string, errorContainer?: HTMLElement): void;
  setValid(field: HTMLElement): void;
  announceError(field: HTMLElement, message: string): void;
  manageFocus(field: HTMLElement, options?: { scrollIntoView?: boolean; preventScroll?: boolean }): void;
  focusFirstInvalid(invalidFields: HTMLElement[], options?: any): void;
  announceValidationSummary(summary: { isValid: boolean; errorCount: number; errors: any }): void;
  setupKeyboardNavigation(form: HTMLFormElement): void;
  ensureTabOrder(form: HTMLFormElement): void;
  destroy(): void;
}

export declare class FormGuard {
  readonly form: HTMLFormElement;
  readonly options: FormGuardOptions;
  readonly isInitialized: boolean;
  readonly isDestroyed: boolean;
  
  static readonly globalValidators: ValidatorRegistry;
  static readonly instances: FormGuard[];
  
  constructor(form: HTMLFormElement, options?: Partial<FormGuardOptions>);
  
  validate(field?: HTMLElement | string): Promise<boolean>;
  validateField(field: HTMLElement): Promise<boolean>;
  validateAllFields(): Promise<boolean>;
  validateGroup(groupName: string): Promise<boolean>;
  validateAllGroups(): Promise<boolean>;

  setFieldError(field: HTMLElement, message: string): void;
  clearFieldError(field: HTMLElement): void;

  // Native validation methods
  checkNativeValidity(field: HTMLElement): { valid: boolean; message?: string };
  getNativeValidationMessage(field: HTMLElement, validity: ValidityState): string;

  getErrors(): Record<string, string>;
  getErrorCount(): number;
  getValidationGroups(): Record<string, HTMLElement[]>;
  getGroupErrors(groupName: string): Record<string, string>;
  clearGroupErrors(groupName: string): void;

  focusFirstInvalid(): void;
  reset(): void;
  destroy(): void;

  setLanguage(language: string): void;
  getLanguage(): string;
  addMessages(language: string, messages: Record<string, string>): void;
  addMessages(messages: Record<string, Record<string, string>>): void;

  // Additional API methods
  isValid(): boolean;
  clearAllErrors(): void;
  getFieldState(field: HTMLElement): {
    isValid: boolean;
    errors: string[];
    isDirty: boolean;
  };
  triggerValidation(field: HTMLElement, eventType?: string): void;

  // Enhanced methods
  cleanupOldState(): void;
  setupPeriodicCleanup(): void;
  
  static addValidator(name: string, validator: ValidatorFunction): void;
  static auto(selector?: string, options?: Partial<FormGuardOptions>): FormGuard[];
  static destroyAll(): void;
}

// Built-in validators
export declare function required(value: any, params: string, field: HTMLElement): boolean | string;
export declare function email(value: string): boolean | string;
export declare function min(value: string | number, params: string, field: HTMLElement): boolean | string;
export declare function max(value: string | number, params: string, field: HTMLElement): boolean | string;
export declare function pattern(value: string, params: string): boolean | string;
export declare function match(value: string, params: string, field: HTMLElement): boolean | string;
export declare function url(value: string): boolean | string;
export declare function number(value: string): boolean | string;
export declare function integer(value: string): boolean | string;
export declare function date(value: string): boolean | string;
export declare function creditcard(value: string, params?: string): boolean | string;
export declare function phone(value: string, params?: string): boolean | string;
export declare function remote(value: string, params: string, field: HTMLElement): Promise<boolean | string>;
export declare function unique(value: string, params: string, field: HTMLElement): Promise<boolean | string>;

export declare class I18n {
  constructor(options?: {
    language?: string | null;
    fallbackLanguage?: string;
    messages?: Record<string, Record<string, string>>;
  });

  setLanguage(language: string): void;
  getLanguage(): string;
  addMessages(language: string, messages: Record<string, string>): void;
  addMessages(messages: Record<string, Record<string, string>>): void;
  t(key: string, ...params: any[]): string;
  getMessage(key: string, language: string): string | null;
  getAvailableLanguages(): string[];
  isLanguageSupported(language: string): boolean;
}

export declare const i18n: I18n;

// Utility functions
export declare function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void;

export declare function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void;

export declare function mergeDeep(target: object, source: object): object;
export declare function getNestedValue(obj: object, path: string, defaultValue?: any): any;
export declare function generateId(prefix?: string): string;
export declare function sanitize(str: string): string;
export declare function isVisible(element: HTMLElement): boolean;
export declare function getFieldValue(field: HTMLElement): any;
export declare function safeFocus(element: HTMLElement): void;
export declare function parseValidationRules(rulesString: string): ValidationRule[];
export declare function createEvent(type: string, detail?: any): CustomEvent;
export declare function escapeRegex(string: string): string;
export declare function isHttpSupported(): boolean;
export declare function makeRequest(url: string, options?: RequestInit): Promise<Response>;

export default FormGuard;