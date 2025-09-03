/**
 * FormGuard - Main entry point
 * Lightweight, accessible, HTML-first form validation library
 */

import { FormGuard } from './formguard.js';
import { I18n, i18n } from './i18n.js';

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

// Export FormGuard class and i18n
export { FormGuard, I18n, i18n };
export default FormGuard;