#!/usr/bin/env node

/**
 * Script to re-enable security tests for development
 * The security tests are disabled during npm publish to prevent hanging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFile = path.join(__dirname, '../test/security.test.js.disabled');
const targetFile = path.join(__dirname, '../test/security.test.js');

if (fs.existsSync(testFile)) {
  fs.renameSync(testFile, targetFile);
  console.log('✅ Security tests re-enabled for development');
  console.log('📝 Note: These tests may hang during npm publish due to async timing issues');
  console.log('🔧 Run "npm run disable-security-tests" before publishing');
} else {
  console.log('ℹ️ Security tests are already enabled or file not found');
}
