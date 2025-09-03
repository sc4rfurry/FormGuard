<div align="center">

# 🛡️ FormGuard

**Enterprise-Grade Form Validation for Modern Web Applications**

[![npm version](https://img.shields.io/npm/v/formguard?style=for-the-badge&logo=npm&color=cb3837)](https://www.npmjs.com/package/formguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/sc4rfurry/FormGuard/ci.yml?style=for-the-badge&logo=github)](https://github.com/sc4rfurry/FormGuard/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/formguard?style=for-the-badge&logo=webpack&color=8dd6f9)](https://bundlephobia.com/package/formguard)
[![Downloads](https://img.shields.io/npm/dm/formguard?style=for-the-badge&logo=npm&color=green)](https://www.npmjs.com/package/formguard)

---

**Zero dependencies • Lightweight • Accessible • Secure • Framework Agnostic**

*FormGuard delivers enterprise-grade form validation with HTML-first configuration, advanced async validation, comprehensive accessibility features, and bulletproof security - all in just ~14KB gzipped.*

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🎯 Examples](#-examples) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ **Why FormGuard?**

<table>
<tr>
<td width="50%">

### 🎯 **Developer Experience**
- **HTML-First**: Define validation with simple data attributes
- **Zero Config**: Works out of the box with sensible defaults
- **Framework Agnostic**: Vanilla JS, React, Vue, Angular - works everywhere
- **TypeScript Ready**: Full type definitions included

</td>
<td width="50%">

### 🚀 **Performance & Security**
- **Lightweight**: Only ~13KB gzipped, zero dependencies
- **Memory Efficient**: Automatic cleanup and memory management
- **XSS Protected**: Built-in sanitization and security features
- **ReDoS Safe**: Regex validation with attack prevention

</td>
</tr>
<tr>
<td width="50%">

### ♿ **Accessibility First**
- **WCAG 2.1 AA Compliant**: Full accessibility support
- **Screen Reader Optimized**: Enhanced announcements and navigation
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Intelligent focus handling

</td>
<td width="50%">

### 🌍 **Enterprise Ready**
- **Internationalization**: 4+ languages with custom translation support
- **Async Validation**: Race condition prevention and request management
- **Group Validation**: Complex form workflows made simple
- **Conditional Logic**: Dynamic validation based on form state

</td>
</tr>
</table>

---

## 🚀 **Quick Start**

### 📦 Installation

<details>
<summary><strong>📋 Multiple Installation Methods</strong></summary>

```bash
# 📦 Package Managers
npm install @sc4rfurry-github/formguard
yarn add @sc4rfurry-github/formguard
pnpm add @sc4rfurry-github/formguard
bun add @sc4rfurry-github/formguard

# 🌐 CDN (Latest)
https://unpkg.com/@sc4rfurry-github/formguard@latest/dist/formguard.min.js
https://cdn.jsdelivr.net/npm/@sc4rfurry-github/formguard@latest/dist/formguard.min.js

# 🌐 CDN (Specific Version)
https://unpkg.com/@sc4rfurry-github/formguard@1.0.0/dist/formguard.min.js
```

</details>

### ⚡ **30-Second Setup**

```html
<!-- 1️⃣ Add validation attributes to your form -->
<form id="signup-form">
  <input
    type="email"
    name="email"
    data-validate="required|email"
    placeholder="Enter your email"
    aria-label="Email address"
  >
  <input
    type="password"
    name="password"
    data-validate="required|min:8|pattern:^(?=.*[A-Za-z])(?=.*\d)"
    placeholder="Create a password"
    aria-label="Password (minimum 8 characters)"
  >
  <button type="submit">Sign Up</button>
</form>
```

```javascript
// 2️⃣ Initialize FormGuard
import { FormGuard } from '@sc4rfurry-github/formguard';

const formGuard = new FormGuard('#signup-form', {
  validateOn: 'blur',
  focusInvalid: true,
  announceErrors: true
});

// 3️⃣ That's it! FormGuard handles the rest ✨
```

---

## 🎯 **Core Features**

<details>
<summary><strong>🔍 Click to explore each feature</strong></summary>

### 🏗️ **HTML-First Validation**
Define validation rules directly in your HTML - no JavaScript configuration needed.

```html
<input data-validate="required|email|unique:/api/check-email" name="email">
<input data-validate="required|min:8|match:password" name="confirm-password">
```

### ⚡ **Smart Async Validation**
Built-in race condition prevention, request cancellation, and retry mechanisms.

```html
<input data-validate="remote:/api/validate-username" name="username">
```

### 🎨 **Flexible Error Display**
Multiple error placement options with customizable templates.

```javascript
const formGuard = new FormGuard(form, {
  errorPlacement: 'after', // 'before', 'append', 'custom'
  errorTemplate: '<div class="error-message" role="alert"></div>'
});
```

### 🧩 **Conditional Validation**
Validate fields only when certain conditions are met.

```html
<input type="checkbox" name="subscribe" id="subscribe">
<input
  name="newsletter-email"
  data-validate="email"
  data-validate-if="subscribe:checked"
>
```

</details>

---

## 📖 **Documentation**

<div align="center">

### 🗂️ **Table of Contents**

[🔧 Installation](#-installation) • [✅ Validation Rules](#-validation-rules) • [🚀 Advanced Features](#-advanced-features) • [🌍 Internationalization](#-internationalization) • [🔒 Security](#-security-features) • [📚 API Reference](#-api-reference) • [🎯 Examples](#-examples) • [🌐 Browser Support](#-browser-support)

</div>

---

## 🔧 **Installation**

<details>
<summary><strong>📦 Package Manager Installation</strong></summary>

```bash
# npm
npm install @sc4rfurry-github/formguard

# Yarn
yarn add @sc4rfurry-github/formguard

# pnpm (recommended for performance)
pnpm add @sc4rfurry-github/formguard

# Bun (fastest)
bun add formguard
```

</details>

<details>
<summary><strong>🌐 CDN Installation</strong></summary>

```html
<!-- Latest version (recommended) -->
<script src="https://unpkg.com/formguard@latest/dist/formguard.min.js"></script>

<!-- Specific version (for production) -->
<script src="https://unpkg.com/formguard@1.0.0/dist/formguard.min.js"></script>

<!-- jsDelivr CDN (alternative) -->
<script src="https://cdn.jsdelivr.net/npm/formguard@latest/dist/formguard.min.js"></script>
```

</details>

<details>
<summary><strong>📥 Module Import Options</strong></summary>

```javascript
// ES6 Modules (recommended)
import { FormGuard } from '@sc4rfurry-github/formguard';

// Default import
import FormGuard from '@sc4rfurry-github/formguard';

// CommonJS
const { FormGuard } = require('@sc4rfurry-github/formguard');

// AMD
define(['formguard'], function(FormGuard) {
  // Your code here
});

// Global (CDN)
const formGuard = new window.FormGuard('#form');
```

</details>

---

## ✅ **Validation Rules**

### 🎯 **Built-in Validators**

<table>
<thead>
<tr>
<th width="15%">Validator</th>
<th width="35%">Usage Example</th>
<th width="50%">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>required</code></td>
<td><code>data-validate="required"</code></td>
<td>Field must have a non-empty value</td>
</tr>
<tr>
<td><code>email</code></td>
<td><code>data-validate="email"</code></td>
<td>RFC 5321/5322 compliant email validation</td>
</tr>
<tr>
<td><code>min</code></td>
<td><code>data-validate="min:5"</code></td>
<td>Minimum length (strings) or value (numbers)</td>
</tr>
<tr>
<td><code>max</code></td>
<td><code>data-validate="max:100"</code></td>
<td>Maximum length (strings) or value (numbers)</td>
</tr>
<tr>
<td><code>pattern</code></td>
<td><code>data-validate="pattern:^[A-Z]+$"</code></td>
<td>Custom regex pattern with ReDoS protection</td>
</tr>
<tr>
<td><code>match</code></td>
<td><code>data-validate="match:password"</code></td>
<td>Must match another field's value</td>
</tr>
<tr>
<td><code>url</code></td>
<td><code>data-validate="url"</code></td>
<td>Valid URL format validation</td>
</tr>
<tr>
<td><code>number</code></td>
<td><code>data-validate="number"</code></td>
<td>Numeric value (integer or decimal)</td>
</tr>
<tr>
<td><code>integer</code></td>
<td><code>data-validate="integer"</code></td>
<td>Integer value only</td>
</tr>
<tr>
<td><code>date</code></td>
<td><code>data-validate="date"</code></td>
<td>Valid date format</td>
</tr>
<tr>
<td><code>creditcard</code></td>
<td><code>data-validate="creditcard"</code></td>
<td>Credit card with type detection</td>
</tr>
<tr>
<td><code>phone</code></td>
<td><code>data-validate="phone"</code></td>
<td>Phone number with country support</td>
</tr>
<tr>
<td><code>remote</code></td>
<td><code>data-validate="remote:/api/check"</code></td>
<td>Server-side async validation</td>
</tr>
<tr>
<td><code>unique</code></td>
<td><code>data-validate="unique:/api/unique"</code></td>
<td>Uniqueness validation via API</td>
</tr>
</tbody>
</table>

### 🔗 **Combining Validators**

Chain multiple validators using the pipe (`|`) separator:

```html
<!-- Email with uniqueness check -->
<input data-validate="required|email|unique:/api/check-email" name="email">

<!-- Strong password requirements -->
<input data-validate="required|min:8|pattern:^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])" name="password">

<!-- Confirm password -->
<input data-validate="required|match:password" name="confirm-password">
```

### 🎨 **Enhanced Validator Features**

<details>
<summary><strong>📧 Email Validator - RFC Compliant</strong></summary>

```html
<!-- Basic email validation -->
<input data-validate="email" type="email" name="email">

<!-- Email with additional constraints -->
<input data-validate="required|email|max:254" name="business-email">
```

**Features:**
- ✅ RFC 5321/5322 compliance
- ✅ Length validation (320 char max)
- ✅ Domain structure validation
- ✅ Comprehensive error messages
- ✅ International domain support

</details>

<details>
<summary><strong>💳 Credit Card Validator - Smart Detection</strong></summary>

```html
<!-- Any card type -->
<input data-validate="creditcard" name="card-number">

<!-- Specific card type -->
<input data-validate="creditcard:visa" name="visa-card">
<input data-validate="creditcard:mastercard" name="mc-card">
```

**Supported Cards:**
- 💳 Visa, Mastercard, American Express
- 💳 Discover, Diners Club, JCB
- 💳 Automatic type detection
- 💳 Test card number detection
- 💳 Luhn algorithm validation

</details>

<details>
<summary><strong>📱 Phone Validator - International Support</strong></summary>

```html
<!-- International format -->
<input data-validate="phone" name="phone">

<!-- Country-specific -->
<input data-validate="phone:us" name="us-phone">
<input data-validate="phone:uk" name="uk-phone">
```

**Features:**
- 🌍 International format support
- 🏳️ Country-specific validation
- 🔍 Pattern validation for obvious fakes
- 📏 Length validation
- 🚫 Sequential/repeated digit detection

</details>

---

## 🚀 **Advanced Features**

### 🎯 **Conditional Validation**

<details>
<summary><strong>🔄 Dynamic Field Validation</strong></summary>

Validate fields only when specific conditions are met:

```html
<!-- Validate email only if subscription is checked -->
<label>
  <input type="checkbox" name="subscribe" id="subscribe">
  Subscribe to newsletter
</label>

<input
  name="newsletter-email"
  data-validate="email"
  data-validate-if="subscribe:checked"
  placeholder="Enter email for newsletter"
>

<!-- State field required only for US -->
<select name="country" id="country">
  <option value="">Select Country</option>
  <option value="us">United States</option>
  <option value="ca">Canada</option>
  <option value="uk">United Kingdom</option>
</select>

<input
  name="state"
  data-validate="required"
  data-validate-if="country:us"
  placeholder="State (required for US)"
>

<!-- Multiple conditions -->
<input
  name="tax-id"
  data-validate="required|pattern:^\d{2}-\d{7}$"
  data-validate-if="country:us,business-type:corporation"
  placeholder="Tax ID (format: XX-XXXXXXX)"
>
```

**Supported Conditions:**
- ✅ `field:value` - Field has specific value
- ✅ `field:checked` - Checkbox/radio is checked
- ✅ `field:!empty` - Field is not empty
- ✅ `field:value1,value2` - Field has one of multiple values

</details>

### 👥 **Group Validation**

<details>
<summary><strong>🗂️ Organize Related Fields</strong></summary>

Group related fields for targeted validation:

```html
<form id="registration-form">
  <!-- Personal Information Group -->
  <fieldset>
    <legend>Personal Information</legend>
    <input
      name="firstName"
      data-validate="required|min:2"
      data-group="personal"
      placeholder="First Name"
    >
    <input
      name="lastName"
      data-validate="required|min:2"
      data-group="personal"
      placeholder="Last Name"
    >
    <input
      name="birthDate"
      data-validate="required|date"
      data-group="personal"
      type="date"
    >
  </fieldset>

  <!-- Contact Information Group -->
  <fieldset>
    <legend>Contact Information</legend>
    <input
      name="email"
      data-validate="required|email|unique:/api/check-email"
      data-group="contact"
      type="email"
      placeholder="Email Address"
    >
    <input
      name="phone"
      data-validate="required|phone"
      data-group="contact"
      placeholder="Phone Number"
    >
  </fieldset>

  <!-- Address Information Group -->
  <fieldset>
    <legend>Address Information</legend>
    <input
      name="street"
      data-validate="required|min:5"
      data-group="address"
      placeholder="Street Address"
    >
    <input
      name="city"
      data-validate="required|min:2"
      data-group="address"
      placeholder="City"
    >
    <input
      name="zipCode"
      data-validate="required|pattern:^\d{5}(-\d{4})?$"
      data-group="address"
      placeholder="ZIP Code"
    >
  </fieldset>
</form>
```

```javascript
// Group validation methods
const formGuard = new FormGuard('#registration-form');

// Validate specific group
const isPersonalValid = await formGuard.validateGroup('personal');
console.log('Personal info valid:', isPersonalValid);

// Validate multiple groups
const contactValid = await formGuard.validateGroup('contact');
const addressValid = await formGuard.validateGroup('address');

// Validate all groups at once
const allGroupsValid = await formGuard.validateAllGroups();

// Get group-specific errors
const personalErrors = formGuard.getGroupErrors('personal');
const contactErrors = formGuard.getGroupErrors('contact');

// Clear group errors
formGuard.clearGroupErrors('personal');

// Get all validation groups
const groups = formGuard.getValidationGroups();
console.log('Available groups:', groups); // ['personal', 'contact', 'address']
```

</details>

### ⚡ **Smart Async Validation**

<details>
<summary><strong>🌐 Server-Side Validation with Race Condition Prevention</strong></summary>

FormGuard provides robust async validation with built-in safeguards:

```html
<!-- Username availability check -->
<input
  name="username"
  data-validate="required|min:3|unique:/api/check-username"
  placeholder="Choose a username"
>

<!-- Email uniqueness validation -->
<input
  name="email"
  data-validate="required|email|remote:/api/validate-email"
  type="email"
  placeholder="Email address"
>

<!-- Custom async validation -->
<input
  name="domain"
  data-validate="required|remote:/api/check-domain?field=domain"
  placeholder="Your domain name"
>
```

**Built-in Protections:**
- 🚫 **Race Condition Prevention**: Cancels previous requests when new ones start
- ⏱️ **Request Timeout**: Configurable timeout with fallback
- 🔄 **Retry Logic**: Automatic retry on network failures
- 🧠 **Memory Management**: Automatic cleanup of async operations
- 📊 **Request Throttling**: Prevents API spam

```javascript
const formGuard = new FormGuard('#form', {
  debounce: 500,           // Wait 500ms before async validation
  asyncTimeout: 5000,      // 5 second timeout for async requests
  maxAsyncPromises: 50,    // Max concurrent async validations
  retryAttempts: 2         // Retry failed requests twice
});

// Monitor async validation using DOM events
formGuard.form.addEventListener('formguard:async-start', (event) => {
  console.log('Async validation started for:', event.detail.field.name);
});

formGuard.form.addEventListener('formguard:async-complete', (event) => {
  console.log('Async validation completed:', event.detail.field.name, event.detail.result);
});
```

</details>

---

## 🌍 **Internationalization**

<details>
<summary><strong>🗣️ Multi-Language Support</strong></summary>

FormGuard provides comprehensive internationalization with automatic language detection and custom translation support:

### 🚀 **Quick Setup**

```javascript
const formGuard = new FormGuard('#form', {
  i18n: {
    language: 'es',           // Set to Spanish
    fallbackLanguage: 'en',   // Fallback to English
    autoDetect: true          // Auto-detect user language
  }
});

// Change language dynamically
formGuard.setLanguage('fr');
console.log('Current language:', formGuard.getLanguage()); // 'fr'
```

### 🌐 **Built-in Languages**

<table>
<tr>
<td width="25%"><strong>🇺🇸 English (en)</strong><br><em>Default</em></td>
<td width="25%"><strong>🇪🇸 Spanish (es)</strong><br><em>Español</em></td>
<td width="25%"><strong>🇫🇷 French (fr)</strong><br><em>Français</em></td>
<td width="25%"><strong>🇩🇪 German (de)</strong><br><em>Deutsch</em></td>
</tr>
</table>

### 🎨 **Custom Translations**

```javascript
// Add translations for a single language
formGuard.addMessages('es', {
  required: 'Este campo es obligatorio',
  email: 'Ingrese un email válido',
  min: 'Mínimo {0} caracteres',
  max: 'Máximo {0} caracteres'
});

// Add multi-language translations
formGuard.addMessages({
  en: {
    strongPassword: 'Password must contain uppercase, lowercase, number, and special character',
    usernameAvailable: 'Username is available',
    usernameTaken: 'Username is already taken'
  },
  es: {
    strongPassword: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    usernameAvailable: 'Nombre de usuario disponible',
    usernameTaken: 'El nombre de usuario ya está en uso'
  },
  fr: {
    strongPassword: 'Le mot de passe doit contenir des majuscules, minuscules, chiffres et caractères spéciaux',
    usernameAvailable: 'Nom d\'utilisateur disponible',
    usernameTaken: 'Le nom d\'utilisateur est déjà pris'
  }
});
```

### 🔍 **Smart Language Detection**

FormGuard automatically detects the user's preferred language using this priority order:

1. **Explicit Configuration** - `i18n.language` option
2. **Stored Preference** - `localStorage.getItem('formguard-language')`
3. **Document Language** - `<html lang="...">` attribute
4. **Browser Language** - `navigator.language`
5. **Fallback Language** - `i18n.fallbackLanguage` (default: 'en')

```javascript
// Language detection in action
const formGuard = new FormGuard('#form', {
  i18n: {
    autoDetect: true,
    fallbackLanguage: 'en'
  }
});

// Save user preference
formGuard.setLanguage('de'); // Automatically saved to localStorage
```

</details>

---

## 🔒 **Security Features**

<details>
<summary><strong>🛡️ Enterprise-Grade Security</strong></summary>

FormGuard is built with security as a first-class citizen, protecting against common web vulnerabilities:

### 🚫 **XSS Prevention**

```javascript
// Automatic sanitization of all user inputs
const formGuard = new FormGuard('#form', {
  sanitizeInputs: true,        // Sanitize all input values
  sanitizeMessages: true,      // Sanitize error messages
  allowedTags: ['b', 'i', 'em'], // Whitelist allowed HTML tags
  escapeHtml: true            // Escape HTML entities
});

// Safe error message handling
formGuard.setFieldError(field, '<script>alert("xss")</script>');
// Automatically sanitized to: &lt;script&gt;alert("xss")&lt;/script&gt;
```

### ⚡ **ReDoS Protection**

Protection against Regular Expression Denial of Service attacks:

```javascript
// Safe patterns - will validate normally
pattern('test123', '^[a-zA-Z0-9]+$');           // ✅ Safe
pattern('email@domain.com', '^[^@]+@[^@]+$');   // ✅ Safe

// Dangerous patterns - automatically detected and blocked
pattern('aaaaaaaaaaaX', '(a+)+$');              // ❌ Nested quantifiers
pattern('test', '([a-zA-Z]+)*$');               // ❌ Exponential backtracking
pattern('input', '(a|a)*$');                   // ❌ Alternation ambiguity

// Configure ReDoS protection
const formGuard = new FormGuard('#form', {
  security: {
    enableReDoSProtection: true,
    maxPatternLength: 1000,
    patternTimeout: 100,        // 100ms timeout for regex execution
    blockDangerousPatterns: true
  }
});
```

### 🧠 **Memory Management**

Prevent memory leaks and resource exhaustion:

```javascript
const formGuard = new FormGuard('#form', {
  memory: {
    maxStateEntries: 1000,          // Max validation states to keep
    stateCleanupInterval: 300000,   // Cleanup every 5 minutes
    maxAsyncPromises: 100,          // Max concurrent async operations
    enableAutoCleanup: true,        // Automatic memory cleanup
    cleanupOnDestroy: true          // Clean up when destroyed
  }
});

// Manual memory management
formGuard.cleanupMemory();          // Force cleanup
formGuard.getMemoryUsage();         // Get current memory stats
```

### 🔐 **Input Validation & Sanitization**

```javascript
// Comprehensive input protection
const formGuard = new FormGuard('#form', {
  security: {
    maxInputLength: 10000,          // Prevent oversized inputs
    blockSuspiciousPatterns: true,  // Block common attack patterns
    validateFileUploads: true,      // Validate file types and sizes
    sanitizeFileNames: true,        // Sanitize uploaded file names
    preventDirectoryTraversal: true // Block path traversal attempts
  }
});
```

### 📊 **Security Monitoring**

```javascript
// Monitor security events using DOM events
formGuard.form.addEventListener('formguard:security-violation', (event) => {
  console.warn('Security violation detected:', event.detail);
  // Log to security monitoring system
});

formGuard.form.addEventListener('formguard:suspicious-activity', (event) => {
  console.warn('Suspicious activity:', event.detail);
  // Implement rate limiting or blocking
});
```

</details>

---

## � **API Reference**

<details>
<summary><strong>🔧 FormGuard Class</strong></summary>

### Constructor

```javascript
const formGuard = new FormGuard(selector, options);
```

**Parameters:**
- `selector` (string|HTMLElement) - Form selector or DOM element
- `options` (object) - Configuration options

### 🎯 **Validation Methods**

```javascript
// Validate entire form
const isValid = await formGuard.validate();

// Validate specific field
const fieldValid = await formGuard.validateField(field);

// Validate field group
const groupValid = await formGuard.validateGroup('groupName');

// Validate all groups
const allGroupsValid = await formGuard.validateAllGroups();

// Manual validation trigger
formGuard.triggerValidation(field, 'blur');
```

### 📊 **State Management**

```javascript
// Check form validity
const isValid = formGuard.isValid();

// Get all errors
const errors = formGuard.getErrors();
// Returns: { fieldName: 'Error message', ... }

// Get error count
const errorCount = formGuard.getErrorCount();

// Get validation groups
const groups = formGuard.getValidationGroups();
// Returns: ['personal', 'contact', 'address']

// Get group-specific errors
const groupErrors = formGuard.getGroupErrors('personal');
```

### 🎨 **Field Management**

```javascript
// Set field error
formGuard.setFieldError(field, 'Custom error message');

// Clear field error
formGuard.clearFieldError(field);

// Clear all errors
formGuard.clearAllErrors();

// Clear group errors
formGuard.clearGroupErrors('groupName');

// Get field state
const fieldState = formGuard.getFieldState(field);
// Returns: { isValid: boolean, errors: string[], isDirty: boolean }
```

### 🌍 **Internationalization**

```javascript
// Set language
formGuard.setLanguage('es');

// Get current language
const currentLang = formGuard.getLanguage();

// Add custom messages
formGuard.addMessages('es', {
  required: 'Campo requerido',
  email: 'Email inválido'
});

// Get available languages
const languages = formGuard.getAvailableLanguages();
```

### 🔄 **Lifecycle Management**

```javascript
// Reset form validation
formGuard.reset();

// Destroy instance and cleanup
formGuard.destroy();

// Check if destroyed
const isDestroyed = formGuard.isDestroyed;
```

</details>

<details>
<summary><strong>🎨 Custom Validators</strong></summary>

### Synchronous Validators

```javascript
formGuard.addCustomValidators({
  // Strong password validator
  strongPassword: (value) => {
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);

    return (hasUpper && hasLower && hasNumber && hasSpecial) ||
           'Password must contain uppercase, lowercase, number, and special character';
  },

  // Age validator
  minimumAge: (value, minAge = 18) => {
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    return age >= minAge || `Must be at least ${minAge} years old`;
  },

  // Custom pattern with friendly message
  socialSecurity: (value) => {
    const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
    return ssnPattern.test(value) || 'Please enter SSN in format: XXX-XX-XXXX';
  }
});
```

### Asynchronous Validators

```javascript
formGuard.addCustomValidators({
  // Username availability
  availableUsername: async (value, params, field) => {
    if (!value || value.length < 3) return true; // Skip if empty or too short

    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
      const data = await response.json();
      return data.available || 'Username is already taken';
    } catch (error) {
      return 'Unable to verify username availability';
    }
  },

  // Email domain validation
  validEmailDomain: async (value, allowedDomains = []) => {
    if (!value.includes('@')) return true;

    const domain = value.split('@')[1];

    try {
      const response = await fetch(`/api/validate-domain?domain=${domain}`);
      const data = await response.json();
      return data.isValid || `Email domain ${domain} is not allowed`;
    } catch (error) {
      return 'Unable to validate email domain';
    }
  },

  // Complex business logic validation
  validateBusinessRules: async (value, params, field) => {
    const formData = new FormData(field.form);

    try {
      const response = await fetch('/api/validate-business-rules', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      return result.isValid || result.message;
    } catch (error) {
      return 'Validation service unavailable';
    }
  }
});
```

### Validator Parameters

```javascript
// Validators can accept parameters
formGuard.addCustomValidators({
  between: (value, min, max) => {
    const num = parseFloat(value);
    return (num >= min && num <= max) || `Value must be between ${min} and ${max}`;
  },

  fileSize: (value, maxSizeMB = 5) => {
    if (!value || !value.files || !value.files[0]) return true;

    const fileSizeMB = value.files[0].size / (1024 * 1024);
    return fileSizeMB <= maxSizeMB || `File size must be less than ${maxSizeMB}MB`;
  }
});

// Usage in HTML
// <input data-validate="between:18,65" name="age">
// <input data-validate="fileSize:10" type="file" name="upload">
```

</details>

---

## 🎯 **Examples**

<details>
<summary><strong>🚀 Real-World Implementation Examples</strong></summary>

### 📝 **Complete Registration Form**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Registration - FormGuard Demo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <form id="registration-form" novalidate>
    <h2>Create Your Account</h2>

    <!-- Personal Information -->
    <fieldset>
      <legend>Personal Information</legend>

      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          data-validate="required|min:2|max:50"
          data-validate-group="personal"
          placeholder="Enter your first name"
          aria-describedby="firstName-help"
        >
        <small id="firstName-help">Minimum 2 characters</small>
      </div>

      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          data-validate="required|min:2|max:50"
          data-validate-group="personal"
          placeholder="Enter your last name"
        >
      </div>

      <div class="form-group">
        <label for="birthDate">Date of Birth *</label>
        <input
          type="date"
          id="birthDate"
          name="birthDate"
          data-validate="required|minimumAge:18"
          data-validate-group="personal"
        >
      </div>
    </fieldset>

    <!-- Account Information -->
    <fieldset>
      <legend>Account Information</legend>

      <div class="form-group">
        <label for="username">Username *</label>
        <input
          type="text"
          id="username"
          name="username"
          data-validate="required|min:3|max:20|pattern:^[a-zA-Z0-9_]+$|availableUsername"
          data-validate-group="account"
          placeholder="Choose a unique username"
          aria-describedby="username-help"
        >
        <small id="username-help">3-20 characters, letters, numbers, and underscores only</small>
      </div>

      <div class="form-group">
        <label for="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          data-validate="required|email|unique:/api/check-email"
          data-validate-group="account"
          placeholder="Enter your email address"
        >
      </div>

      <div class="form-group">
        <label for="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          data-validate="required|min:8|strongPassword"
          data-validate-group="account"
          placeholder="Create a strong password"
          aria-describedby="password-help"
        >
        <small id="password-help">Must contain uppercase, lowercase, number, and special character</small>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password *</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          data-validate="required|match:password"
          data-validate-group="account"
          placeholder="Confirm your password"
        >
      </div>
    </fieldset>

    <!-- Optional Newsletter -->
    <fieldset>
      <legend>Preferences</legend>

      <div class="form-group">
        <label>
          <input
            type="checkbox"
            name="newsletter"
            id="newsletter"
          >
          Subscribe to our newsletter
        </label>
      </div>

      <div class="form-group">
        <label for="newsletterEmail">Newsletter Email</label>
        <input
          type="email"
          id="newsletterEmail"
          name="newsletterEmail"
          data-validate="email"
          data-validate-if="newsletter:checked"
          placeholder="Email for newsletter (optional)"
        >
      </div>
    </fieldset>

    <div class="form-actions">
      <button type="button" id="validate-personal">Validate Personal Info</button>
      <button type="button" id="validate-account">Validate Account Info</button>
      <button type="submit">Create Account</button>
    </div>
  </form>

  <script src="https://unpkg.com/formguard@latest/dist/formguard.min.js"></script>
  <script>
    // Initialize FormGuard
    const formGuard = new FormGuard('#registration-form', {
      validateOn: 'blur',
      focusInvalid: true,
      announceErrors: true,
      i18n: {
        language: 'en',
        autoDetect: true
      }
    });

    // Add custom validators
    formGuard.addCustomValidators({
      minimumAge: (value, minAge = 18) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age >= minAge || `You must be at least ${minAge} years old`;
      },

      strongPassword: (value) => {
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        if (!hasUpper) return 'Password must contain at least one uppercase letter';
        if (!hasLower) return 'Password must contain at least one lowercase letter';
        if (!hasNumber) return 'Password must contain at least one number';
        if (!hasSpecial) return 'Password must contain at least one special character';

        return true;
      },

      availableUsername: async (value) => {
        if (!value || value.length < 3) return true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const unavailableUsernames = ['admin', 'user', 'test', 'demo'];
        return !unavailableUsernames.includes(value.toLowerCase()) ||
               'This username is not available';
      }
    });

    // Group validation buttons
    document.getElementById('validate-personal').addEventListener('click', async () => {
      const isValid = await formGuard.validateGroup('personal');
      alert(isValid ? 'Personal information is valid!' : 'Please fix personal information errors');
    });

    document.getElementById('validate-account').addEventListener('click', async () => {
      const isValid = await formGuard.validateGroup('account');
      alert(isValid ? 'Account information is valid!' : 'Please fix account information errors');
    });

    // Form submission
    document.getElementById('registration-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const isValid = await formGuard.validate();

      if (isValid) {
        alert('Registration successful!');
        // Submit form data to server
      } else {
        alert('Please fix all errors before submitting');
      }
    });
  </script>
</body>
</html>
```

</details>

---

## 🌐 **Browser Support**

<table>
<thead>
<tr>
<th width="20%">Browser</th>
<th width="15%">Version</th>
<th width="65%">Notes</th>
</tr>
</thead>
<tbody>
<tr>
<td>🌐 Chrome</td>
<td>90+</td>
<td>Full support for all features</td>
</tr>
<tr>
<td>🦊 Firefox</td>
<td>88+</td>
<td>Full support for all features</td>
</tr>
<tr>
<td>🧭 Safari</td>
<td>14+</td>
<td>Full support for all features</td>
</tr>
<tr>
<td>🌊 Edge</td>
<td>90+</td>
<td>Full support for all features</td>
</tr>
<tr>
<td>🎭 Opera</td>
<td>76+</td>
<td>Full support for all features</td>
</tr>
</tbody>
</table>

### 🔧 **Feature Requirements**

<details>
<summary><strong>📋 Technical Requirements</strong></summary>

**JavaScript Features:**
- ✅ ES6+ (Arrow functions, async/await, destructuring, modules)
- ✅ Promise support with async/await
- ✅ Map and Set collections
- ✅ Template literals and tagged templates

**DOM APIs:**
- ✅ MutationObserver (for dynamic form changes)
- ✅ IntersectionObserver (for performance optimization)
- ✅ Fetch API (for async validation)
- ✅ AbortController (for request cancellation)

**CSS Features:**
- ✅ CSS Custom Properties (for theming)
- ✅ CSS Grid and Flexbox (for layout)
- ✅ CSS transitions and animations

**Accessibility:**
- ✅ ARIA attributes and roles
- ✅ Screen reader compatibility
- ✅ Keyboard navigation support
- ✅ Focus management

</details>

---

## 📊 **Performance**

<div align="center">

[![Bundle Size](https://img.shields.io/bundlephobia/minzip/formguard?style=for-the-badge&logo=webpack&color=8dd6f9)](https://bundlephobia.com/package/formguard)
[![Performance](https://img.shields.io/badge/Performance-Optimized-green?style=for-the-badge&logo=speedtest)](https://github.com/sc4rfurry/FormGuard)

</div>

### ⚡ **Performance Metrics**

- **📦 Bundle Size**: ~13KB gzipped (smaller than most alternatives)
- **🧠 Memory Usage**: Configurable limits with automatic cleanup
- **⚡ Validation Speed**: <1ms for sync validators, optimized async handling
- **🎨 DOM Updates**: RAF-batched for smooth 60fps performance
- **🔄 Async Operations**: Intelligent debouncing and request cancellation
- **♻️ Memory Management**: Automatic garbage collection and cleanup

---

## 🤝 **Contributing**

<div align="center">

**We ❤️ contributions from the community!**

[![Contributors](https://img.shields.io/github/contributors/sc4rfurry/FormGuard?style=for-the-badge)](https://github.com/sc4rfurry/FormGuard/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/sc4rfurry/FormGuard?style=for-the-badge)](https://github.com/sc4rfurry/FormGuard/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/sc4rfurry/FormGuard?style=for-the-badge)](https://github.com/sc4rfurry/FormGuard/pulls)

</div>

### 🚀 **Quick Start for Contributors**

<details>
<summary><strong>🛠️ Development Setup</strong></summary>

```bash
# 1️⃣ Fork and clone the repository
git clone https://github.com/sc4rfurry/FormGuard.git
cd FormGuard

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run tests to ensure everything works
npm test

# 4️⃣ Start development server
npm run dev

# 5️⃣ Make your changes and test
npm run test:watch

# 6️⃣ Build for production
npm run build

# 7️⃣ Run linting
npm run lint

# 8️⃣ Format code
npm run format
```

</details>

<details>
<summary><strong>🧪 Testing Guidelines</strong></summary>

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- validators.test.js

# Run tests for specific pattern
npm test -- --testNamePattern="email validation"
```

**Test Coverage Requirements:**
- 🎯 **Minimum 90% code coverage**
- ✅ Unit tests for all validators
- ✅ Integration tests for form workflows
- ✅ Accessibility tests for screen readers
- ✅ Performance tests for large forms

</details>

### 📋 **Contribution Process**

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💻 Make** your changes with tests
4. **✅ Ensure** all tests pass (`npm test`)
5. **📝 Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **🚀 Push** to your branch (`git push origin feature/amazing-feature`)
7. **🔄 Open** a Pull Request

---

## 📊 **Project Stats**

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/sc4rfurry/FormGuard?style=social)](https://github.com/sc4rfurry/FormGuard/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/sc4rfurry/FormGuard?style=social)](https://github.com/sc4rfurry/FormGuard/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/sc4rfurry/FormGuard?style=social)](https://github.com/sc4rfurry/FormGuard/watchers)

</div>

---

## 📄 **License**

<div align="center">

**FormGuard is MIT Licensed**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*This means you can use FormGuard in any project, commercial or personal, with attribution.*

[📖 Read the full license](LICENSE)

</div>

---

## 🙏 **Acknowledgments**

<div align="center">

**Special thanks to our amazing contributors and the open source community!**

</div>

- 🌟 **Contributors**: Thank you to everyone who has contributed code, documentation, and ideas
- 🎯 **Inspiration**: Built following modern web standards and accessibility guidelines
- 🛠️ **Tools**: Powered by Jest, Rollup, and other amazing open source tools
- 🌍 **Community**: Grateful for feedback and support from developers worldwide

---

## 🔗 **Links & Resources**

<div align="center">

### 📚 **Documentation & Guides**
[📖 Full Documentation](https://github.com/sc4rfurry/FormGuard/wiki) • [🎯 Examples](https://github.com/sc4rfurry/FormGuard/tree/main/examples) • [🔧 API Reference](https://github.com/sc4rfurry/FormGuard/blob/main/docs/api.md)

### 🤝 **Community & Support**
[💬 Discussions](https://github.com/sc4rfurry/FormGuard/discussions) • [🐛 Issues](https://github.com/sc4rfurry/FormGuard/issues) • [📧 Contact](mailto:sc4rfurry@proton.me)

### 🚀 **Development**
[🔄 Changelog](https://github.com/sc4rfurry/FormGuard/blob/main/CHANGELOG.md) • [🛣️ Roadmap](https://github.com/sc4rfurry/FormGuard/projects) • [🤝 Contributing](https://github.com/sc4rfurry/FormGuard/blob/main/CONTRIBUTING.md)

---

<div align="center">

**Made with ❤️ by [sc4rfurry](https://github.com/sc4rfurry)**

*FormGuard - Enterprise-Grade Form Validation for Modern Web Applications*

[⭐ Star us on GitHub](https://github.com/sc4rfurry/FormGuard) • [🚀 Get Started](#-quick-start) • [📖 Read the Docs](https://github.com/sc4rfurry/FormGuard/wiki)

---

*If FormGuard has helped your project, please consider giving it a ⭐ on GitHub!*

</div>

</div>
