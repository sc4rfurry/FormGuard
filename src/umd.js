/**
 * FormGuard - UMD/IIFE entry point
 * Exports FormGuard as the default export for global usage
 */

import { FormGuard, I18n, i18n } from './index.js';

// Auto-initialize on DOM ready if data-auto-init is present
function autoInit() {
  if (document.querySelector('[data-formguard-auto]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        FormGuard.auto('[data-formguard-auto]');
      });
    } else {
      FormGuard.auto('[data-formguard-auto]');
    }
  }
}

// Initialize auto-init
autoInit();

// Attach additional exports to FormGuard for global access
FormGuard.I18n = I18n;
FormGuard.i18n = i18n;

// Export FormGuard as default for UMD/IIFE builds
export default FormGuard;
