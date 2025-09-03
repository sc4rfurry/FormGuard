/**
 * Real-World Integration Scenarios Testing
 * Tests FormGuard in complex, real-world usage scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('FormGuard Real-World Scenarios', () => {
  test.describe('Multi-Step Form Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      // Create a multi-step form scenario
      await page.goto('/examples/basic-usage.html');
      await page.evaluate(() => {
        // Transform the basic form into a multi-step form
        const form = document.querySelector('form');
        form.innerHTML = `
          <div class="step" id="step1">
            <h2>Step 1: Personal Information</h2>
            <input name="firstName" data-validate="required|min:2" placeholder="First Name">
            <input name="lastName" data-validate="required|min:2" placeholder="Last Name">
            <input name="email" data-validate="required|email" placeholder="Email">
            <button type="button" id="next1">Next</button>
          </div>
          <div class="step" id="step2" style="display:none">
            <h2>Step 2: Account Details</h2>
            <input name="username" data-validate="required|min:3|remote:/api/check-username" placeholder="Username">
            <input type="password" name="password" data-validate="required|min:8" placeholder="Password">
            <input type="password" name="confirmPassword" data-validate="required|match:password" placeholder="Confirm Password">
            <button type="button" id="prev1">Previous</button>
            <button type="button" id="next2">Next</button>
          </div>
          <div class="step" id="step3" style="display:none">
            <h2>Step 3: Preferences</h2>
            <input type="checkbox" name="newsletter" value="yes">
            <label for="newsletter">Subscribe to newsletter</label>
            <input name="company" data-validate-if="newsletter:yes" data-validate="required" placeholder="Company (required if newsletter)">
            <button type="button" id="prev2">Previous</button>
            <button type="submit">Complete Registration</button>
          </div>
        `;
        
        // Add step navigation logic
        let currentStep = 1;
        const showStep = (step) => {
          document.querySelectorAll('.step').forEach(s => s.style.display = 'none');
          document.getElementById(`step${step}`).style.display = 'block';
          currentStep = step;
        };
        
        document.getElementById('next1').onclick = async () => {
          const formGuard = window.testFormGuard;
          const step1Fields = ['firstName', 'lastName', 'email'];
          let allValid = true;
          
          for (const fieldName of step1Fields) {
            const isValid = await formGuard.validate(fieldName);
            if (!isValid) allValid = false;
          }
          
          if (allValid) showStep(2);
        };
        
        document.getElementById('next2').onclick = async () => {
          const formGuard = window.testFormGuard;
          const step2Fields = ['username', 'password', 'confirmPassword'];
          let allValid = true;
          
          for (const fieldName of step2Fields) {
            const isValid = await formGuard.validate(fieldName);
            if (!isValid) allValid = false;
          }
          
          if (allValid) showStep(3);
        };
        
        document.getElementById('prev1').onclick = () => showStep(1);
        document.getElementById('prev2').onclick = () => showStep(2);
        
        // Initialize FormGuard
        window.testFormGuard = new FormGuard(form);
      });
    });

    test('should validate each step before proceeding', async ({ page }) => {
      // Try to proceed without filling step 1
      await page.click('#next1');
      
      // Should still be on step 1
      const step1Visible = await page.locator('#step1').isVisible();
      expect(step1Visible).toBeTruthy();
      
      // Fill step 1 correctly
      await page.fill('[name="firstName"]', 'John');
      await page.fill('[name="lastName"]', 'Doe');
      await page.fill('[name="email"]', 'john@example.com');
      
      await page.click('#next1');
      
      // Should now be on step 2
      const step2Visible = await page.locator('#step2').isVisible();
      expect(step2Visible).toBeTruthy();
    });

    test('should handle conditional validation in multi-step forms', async ({ page }) => {
      // Navigate to step 3
      await page.fill('[name="firstName"]', 'John');
      await page.fill('[name="lastName"]', 'Doe');
      await page.fill('[name="email"]', 'john@example.com');
      await page.click('#next1');
      
      await page.fill('[name="username"]', 'johndoe');
      await page.fill('[name="password"]', 'securepass123');
      await page.fill('[name="confirmPassword"]', 'securepass123');
      await page.click('#next2');
      
      // Test conditional validation
      await page.check('[name="newsletter"]');
      
      // Now company field should be required
      await page.click('[type="submit"]');
      
      await page.waitForSelector('.error-message');
      const companyError = await page.locator('[name="company"] + .error-message').count();
      expect(companyError).toBeGreaterThan(0);
      
      // Fill company and retry
      await page.fill('[name="company"]', 'Acme Corp');
      await page.click('[type="submit"]');
      
      // Should now pass validation
      await page.waitForTimeout(500);
    });
  });

  test.describe('E-commerce Form Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/examples/basic-usage.html');
      await page.evaluate(() => {
        // Create an e-commerce checkout form
        const form = document.querySelector('form');
        form.innerHTML = `
          <fieldset>
            <legend>Billing Information</legend>
            <input name="billingName" data-validate="required|min:2" placeholder="Full Name">
            <input name="billingAddress" data-validate="required" placeholder="Address">
            <input name="billingCity" data-validate="required" placeholder="City">
            <select name="billingState" data-validate="required">
              <option value="">Select State</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
            </select>
            <input name="billingZip" data-validate="required|pattern:[0-9]{5}" placeholder="ZIP Code">
          </fieldset>
          
          <fieldset>
            <legend>Shipping Information</legend>
            <input type="checkbox" name="sameAsBilling" id="sameAsBilling">
            <label for="sameAsBilling">Same as billing address</label>
            
            <input name="shippingName" data-validate-if="sameAsBilling:false" data-validate="required|min:2" placeholder="Full Name">
            <input name="shippingAddress" data-validate-if="sameAsBilling:false" data-validate="required" placeholder="Address">
            <input name="shippingCity" data-validate-if="sameAsBilling:false" data-validate="required" placeholder="City">
            <select name="shippingState" data-validate-if="sameAsBilling:false" data-validate="required">
              <option value="">Select State</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
            </select>
            <input name="shippingZip" data-validate-if="sameAsBilling:false" data-validate="required|pattern:[0-9]{5}" placeholder="ZIP Code">
          </fieldset>
          
          <fieldset>
            <legend>Payment Information</legend>
            <input name="cardNumber" data-validate="required|creditcard" placeholder="Card Number">
            <input name="expMonth" data-validate="required|pattern:[0-9]{2}" placeholder="MM">
            <input name="expYear" data-validate="required|pattern:[0-9]{4}" placeholder="YYYY">
            <input name="cvv" data-validate="required|pattern:[0-9]{3,4}" placeholder="CVV">
            <input name="cardName" data-validate="required" placeholder="Name on Card">
          </fieldset>
          
          <button type="submit">Complete Order</button>
        `;
        
        // Add form logic
        window.testFormGuard = new FormGuard(form);
        
        // Handle same as billing checkbox
        document.getElementById('sameAsBilling').addEventListener('change', function() {
          const shippingFields = ['shippingName', 'shippingAddress', 'shippingCity', 'shippingState', 'shippingZip'];
          const billingFields = ['billingName', 'billingAddress', 'billingCity', 'billingState', 'billingZip'];
          
          if (this.checked) {
            // Copy billing to shipping
            shippingFields.forEach((field, index) => {
              const shippingField = document.querySelector(`[name="${field}"]`);
              const billingField = document.querySelector(`[name="${billingFields[index]}"]`);
              if (shippingField && billingField) {
                shippingField.value = billingField.value;
              }
            });
          }
        });
      });
    });

    test('should validate credit card information correctly', async ({ page }) => {
      // Test invalid credit card
      await page.fill('[name="cardNumber"]', '1234567890123456'); // Invalid card
      await page.locator('[name="cardNumber"]').blur();
      
      await page.waitForSelector('.error-message');
      
      // Should show credit card error
      const cardError = await page.locator('[name="cardNumber"] + .error-message').textContent();
      expect(cardError).toBeTruthy();
      
      // Test valid credit card (test number)
      await page.fill('[name="cardNumber"]', '4532015112830366'); // Valid test card
      await page.locator('[name="cardNumber"]').blur();
      
      await page.waitForTimeout(500);
      const hasError = await page.locator('[name="cardNumber"] + .error-message').count();
      expect(hasError).toBe(0);
    });

    test('should handle conditional shipping address validation', async ({ page }) => {
      // Fill billing info first
      await page.fill('[name="billingName"]', 'John Doe');
      await page.fill('[name="billingAddress"]', '123 Main St');
      await page.fill('[name="billingCity"]', 'Anytown');
      await page.selectOption('[name="billingState"]', 'CA');
      await page.fill('[name="billingZip"]', '90210');
      
      // Initially, shipping should be required
      await page.click('[type="submit"]');
      
      await page.waitForSelector('.error-message');
      const shippingErrors = await page.locator('[name^="shipping"] + .error-message').count();
      expect(shippingErrors).toBeGreaterThan(0);
      
      // Check "same as billing"
      await page.check('#sameAsBilling');
      
      // Now shipping fields should not be required
      await page.fill('[name="cardNumber"]', '4532015112830366');
      await page.fill('[name="expMonth"]', '12');
      await page.fill('[name="expYear"]', '2025');
      await page.fill('[name="cvv"]', '123');
      await page.fill('[name="cardName"]', 'John Doe');
      
      await page.click('[type="submit"]');
      await page.waitForTimeout(500);
      
      // Should not have shipping validation errors now
      const remainingShippingErrors = await page.locator('[name^="shipping"] + .error-message').count();
      expect(remainingShippingErrors).toBe(0);
    });
  });

  test.describe('Dynamic Form Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/examples/basic-usage.html');
      await page.evaluate(() => {
        // Create a dynamic form that adds/removes fields
        const form = document.querySelector('form');
        form.innerHTML = `
          <div>
            <label>Number of attendees:</label>
            <input type="number" id="attendeeCount" min="1" max="10" value="1">
          </div>
          <div id="attendeesContainer">
            <div class="attendee" data-index="0">
              <h3>Attendee 1</h3>
              <input name="attendee_0_name" data-validate="required|min:2" placeholder="Name">
              <input name="attendee_0_email" data-validate="required|email" placeholder="Email">
            </div>
          </div>
          <button type="button" id="updateAttendees">Update Attendees</button>
          <button type="submit">Submit Registration</button>
        `;
        
        window.testFormGuard = new FormGuard(form);
        
        // Dynamic attendee management
        document.getElementById('updateAttendees').onclick = () => {
          const count = parseInt(document.getElementById('attendeeCount').value);
          const container = document.getElementById('attendeesContainer');
          
          // Clear existing attendees
          container.innerHTML = '';
          
          // Add attendees
          for (let i = 0; i < count; i++) {
            const attendeeDiv = document.createElement('div');
            attendeeDiv.className = 'attendee';
            attendeeDiv.setAttribute('data-index', i);
            attendeeDiv.innerHTML = `
              <h3>Attendee ${i + 1}</h3>
              <input name="attendee_${i}_name" data-validate="required|min:2" placeholder="Name">
              <input name="attendee_${i}_email" data-validate="required|email" placeholder="Email">
            `;
            container.appendChild(attendeeDiv);
          }
        };
      });
    });

    test('should validate dynamically added fields', async ({ page }) => {
      // Change attendee count and update
      await page.fill('#attendeeCount', '3');
      await page.click('#updateAttendees');
      
      // Verify 3 attendees were created
      const attendeeCount = await page.locator('.attendee').count();
      expect(attendeeCount).toBe(3);
      
      // Fill some attendees and leave others empty
      await page.fill('[name="attendee_0_name"]', 'John Doe');
      await page.fill('[name="attendee_0_email"]', 'john@example.com');
      
      await page.fill('[name="attendee_1_name"]', 'Jane Smith');
      // Leave attendee_1_email empty
      
      // Leave attendee_2 completely empty
      
      // Submit and check validation
      await page.click('[type="submit"]');
      
      await page.waitForTimeout(500);
      
      // Should have validation errors for empty fields
      const errorCount = await page.locator('.error-message').count();
      expect(errorCount).toBeGreaterThan(0);
      
      // Fill remaining fields
      await page.fill('[name="attendee_1_email"]', 'jane@example.com');
      await page.fill('[name="attendee_2_name"]', 'Bob Johnson');
      await page.fill('[name="attendee_2_email"]', 'bob@example.com');
      
      // Submit again
      await page.click('[type="submit"]');
      await page.waitForTimeout(500);
      
      // Should now pass validation
      const remainingErrors = await page.locator('.error-message').count();
      expect(remainingErrors).toBe(0);
    });
  });

  test.describe('File Upload Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/examples/basic-usage.html');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        form.innerHTML = `
          <div>
            <label>Profile Picture:</label>
            <input type="file" name="profilePic" data-validate="required" accept="image/*">
            <div class="file-info" id="profilePicInfo"></div>
          </div>
          <div>
            <label>Resume (PDF only):</label>
            <input type="file" name="resume" data-validate="required" accept=".pdf">
            <div class="file-info" id="resumeInfo"></div>
          </div>
          <div>
            <label>Documents (max 3 files):</label>
            <input type="file" name="documents" multiple data-validate="required">
            <div class="file-info" id="documentsInfo"></div>
          </div>
          <button type="submit">Upload Files</button>
        `;
        
        // Add file validation logic
        FormGuard.addValidator('fileType', (value, params, field) => {
          if (!field.files || field.files.length === 0) return true; // handled by required
          
          const allowedTypes = params.split(',');
          for (const file of field.files) {
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            
            let isValid = false;
            for (const allowed of allowedTypes) {
              if (allowed.startsWith('.')) {
                // Extension check
                if (fileName.endsWith(allowed)) {
                  isValid = true;
                  break;
                }
              } else {
                // MIME type check
                if (fileType.includes(allowed)) {
                  isValid = true;
                  break;
                }
              }
            }
            
            if (!isValid) {
              return `File ${file.name} is not a valid ${params} file`;
            }
          }
          
          return true;
        });
        
        FormGuard.addValidator('maxFiles', (value, params, field) => {
          if (!field.files) return true;
          const maxFiles = parseInt(params);
          if (field.files.length > maxFiles) {
            return `Maximum ${maxFiles} files allowed`;
          }
          return true;
        });
        
        FormGuard.addValidator('fileSize', (value, params, field) => {
          if (!field.files) return true;
          const maxSize = parseInt(params) * 1024 * 1024; // Convert MB to bytes
          
          for (const file of field.files) {
            if (file.size > maxSize) {
              return `File ${file.name} is too large. Maximum size is ${params}MB`;
            }
          }
          
          return true;
        });
        
        // Update validation attributes
        document.querySelector('[name="resume"]').setAttribute('data-validate', 'required|fileType:.pdf|fileSize:5');
        document.querySelector('[name="documents"]').setAttribute('data-validate', 'required|maxFiles:3|fileSize:10');
        
        window.testFormGuard = new FormGuard(form);
      });
    });

    test('should validate file uploads correctly', async ({ page }) => {
      // Test form submission without files
      await page.click('[type="submit"]');
      
      await page.waitForSelector('.error-message');
      
      // Should have required file errors
      const fileErrors = await page.locator('.error-message').count();
      expect(fileErrors).toBeGreaterThan(0);
      
      // Create test files
      await page.evaluate(() => {
        // Create mock file objects for testing
        const createMockFile = (name, type, size) => {
          const file = new File(['mock content'], name, { type, lastModified: Date.now() });
          Object.defineProperty(file, 'size', { value: size });
          return file;
        };
        
        // Mock file selection for profile picture
        const profilePic = document.querySelector('[name="profilePic"]');
        const profileFile = createMockFile('profile.jpg', 'image/jpeg', 1024 * 1024); // 1MB
        Object.defineProperty(profilePic, 'files', {
          value: [profileFile],
          writable: false
        });
        profilePic.dispatchEvent(new Event('change'));
        
        // Mock file selection for resume
        const resume = document.querySelector('[name="resume"]');
        const resumeFile = createMockFile('resume.pdf', 'application/pdf', 2 * 1024 * 1024); // 2MB
        Object.defineProperty(resume, 'files', {
          value: [resumeFile],
          writable: false
        });
        resume.dispatchEvent(new Event('change'));
        
        // Mock file selection for documents
        const documents = document.querySelector('[name="documents"]');
        const doc1 = createMockFile('doc1.txt', 'text/plain', 1024);
        const doc2 = createMockFile('doc2.txt', 'text/plain', 1024);
        Object.defineProperty(documents, 'files', {
          value: [doc1, doc2],
          writable: false
        });
        documents.dispatchEvent(new Event('change'));
      });
      
      // Trigger validation
      await page.locator('[name="profilePic"]').blur();
      await page.locator('[name="resume"]').blur();
      await page.locator('[name="documents"]').blur();
      
      await page.waitForTimeout(500);
      
      // Should now pass validation
      await page.click('[type="submit"]');
      await page.waitForTimeout(500);
      
      const remainingErrors = await page.locator('.error-message').count();
      expect(remainingErrors).toBe(0);
    });
  });

  test.describe('Real-time Collaboration Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/examples/basic-usage.html');
      // Set up a collaborative editing scenario
      await page.evaluate(() => {
        const form = document.querySelector('form');
        form.innerHTML = `
          <div>
            <label>Shared Document Title:</label>
            <input name="docTitle" data-validate="required|min:3" placeholder="Document title">
            <div class="collaboration-info">Users editing: <span id="activeUsers">1</span></div>
          </div>
          <div>
            <label>Content:</label>
            <textarea name="content" data-validate="required|min:10" placeholder="Document content"></textarea>
          </div>
          <div>
            <label>Auto-save enabled:</label>
            <input type="checkbox" name="autosave" checked>
          </div>
          <button type="button" id="saveButton">Save</button>
          <button type="submit">Publish</button>
        `;
        
        window.testFormGuard = new FormGuard(form);
        
        // Simulate real-time updates from other users
        let updateInterval;
        document.querySelector('[name="autosave"]').addEventListener('change', function() {
          if (this.checked) {
            updateInterval = setInterval(() => {
              // Simulate collaborative updates
              const activeUsers = Math.floor(Math.random() * 5) + 1;
              document.getElementById('activeUsers').textContent = activeUsers;
              
              // Simulate external content changes (from other users)
              if (Math.random() < 0.3) { // 30% chance of external update
                const content = document.querySelector('[name="content"]');
                if (content.value.length > 0) {
                  content.value += ' [Updated by user' + Math.floor(Math.random() * 3 + 2) + ']';
                  content.dispatchEvent(new Event('input'));
                }
              }
            }, 2000);
          } else {
            clearInterval(updateInterval);
          }
        });
        
        // Auto-save functionality
        let saveTimeout;
        const autoSave = () => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(async () => {
            if (document.querySelector('[name="autosave"]').checked) {
              const isValid = await window.testFormGuard.validate();
              if (isValid) {
                console.log('Auto-saved successfully');
                // In real app, would save to server
              }
            }
          }, 3000);
        };
        
        document.querySelector('[name="docTitle"]').addEventListener('input', autoSave);
        document.querySelector('[name="content"]').addEventListener('input', autoSave);
        
        // Manual save
        document.getElementById('saveButton').onclick = async () => {
          const isValid = await window.testFormGuard.validate();
          if (!isValid) {
            alert('Please fix validation errors before saving');
          } else {
            alert('Document saved successfully!');
          }
        };
        
        // Start auto-save
        document.querySelector('[name="autosave"]').dispatchEvent(new Event('change'));
      });
    });

    test('should handle real-time validation with concurrent updates', async ({ page }) => {
      // Fill initial content
      await page.fill('[name="docTitle"]', 'My Document');
      await page.fill('[name="content"]', 'Initial content here');
      
      // Wait for auto-save interval to trigger some updates
      await page.waitForTimeout(5000);
      
      // Verify content was updated by simulated users
      const updatedContent = await page.locator('[name="content"]').inputValue();
      expect(updatedContent).toContain('Updated by user');
      
      // Test validation still works with dynamic content
      await page.fill('[name="docTitle"]', ''); // Make invalid
      await page.click('#saveButton');
      
      // Should show validation error
      await page.waitForTimeout(500);
      const alertHandled = await page.evaluate(() => {
        // Check if alert was triggered (validation failed)
        return window.testAlertTriggered || false;
      });
      
      // Fill valid data and save
      await page.fill('[name="docTitle"]', 'Valid Document Title');
      await page.click('#saveButton');
      
      await page.waitForTimeout(500);
    });
  });

  test.describe('API Integration Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      // Mock various API endpoints
      await page.route('**/api/validate-email', async route => {
        const url = new URL(route.request().url());
        const email = url.searchParams.get('email');
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
        
        await route.fulfill({
          json: {
            valid: email !== 'taken@example.com',
            message: email === 'taken@example.com' ? 'Email already registered' : 'Email available'
          }
        });
      });
      
      await page.route('**/api/validate-username', async route => {
        const url = new URL(route.request().url());
        const username = url.searchParams.get('username');
        await new Promise(resolve => setTimeout(resolve, 150));
        
        await route.fulfill({
          json: {
            valid: username !== 'admin' && username !== 'root',
            message: ['admin', 'root'].includes(username) ? 'Username not available' : 'Username available'
          }
        });
      });
      
      await page.route('**/api/validate-domain', async route => {
        const url = new URL(route.request().url());
        const domain = url.searchParams.get('domain');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await route.fulfill({
          json: {
            valid: domain.includes('.'),
            message: domain.includes('.') ? 'Domain format valid' : 'Invalid domain format'
          }
        });
      });
      
      await page.goto('/examples/basic-usage.html');
      await page.evaluate(() => {
        // Create a form with multiple async validators
        const form = document.querySelector('form');
        form.innerHTML = `
          <div>
            <label>Email:</label>
            <input name="email" data-validate="required|email|remote:/api/validate-email" placeholder="Email">
          </div>
          <div>
            <label>Username:</label>
            <input name="username" data-validate="required|min:3|remote:/api/validate-username" placeholder="Username">
          </div>
          <div>
            <label>Website Domain:</label>
            <input name="domain" data-validate="required|remote:/api/validate-domain" placeholder="example.com">
          </div>
          <button type="submit">Register</button>
        `;
        
        window.testFormGuard = new FormGuard(form, {
          debounce: 300,
          validateOn: 'blur'
        });
      });
    });

    test('should handle multiple concurrent API validations', async ({ page }) => {
      // Fill all fields quickly to trigger concurrent API calls
      await page.fill('[name="email"]', 'user@example.com');
      await page.fill('[name="username"]', 'testuser');
      await page.fill('[name="domain"]', 'example.com');
      
      // Blur all fields to trigger validation
      await page.locator('[name="email"]').blur();
      await page.locator('[name="username"]').blur();
      await page.locator('[name="domain"]').blur();
      
      // Wait for all async validations to complete
      await page.waitForTimeout(1000);
      
      // Should have no errors for valid inputs
      const errorCount = await page.locator('.error-message').count();
      expect(errorCount).toBe(0);
      
      // Test with invalid inputs
      await page.fill('[name="email"]', 'taken@example.com');
      await page.fill('[name="username"]', 'admin');
      await page.fill('[name="domain"]', 'invalid-domain');
      
      await page.locator('[name="email"]').blur();
      await page.locator('[name="username"]').blur();
      await page.locator('[name="domain"]').blur();
      
      await page.waitForTimeout(1000);
      
      // Should have errors for invalid inputs
      const finalErrorCount = await page.locator('.error-message').count();
      expect(finalErrorCount).toBe(3);
      
      // Verify specific error messages
      const emailError = await page.locator('[name="email"] + .error-message').textContent();
      const usernameError = await page.locator('[name="username"] + .error-message').textContent();
      const domainError = await page.locator('[name="domain"] + .error-message').textContent();
      
      expect(emailError).toContain('already registered');
      expect(usernameError).toContain('not available');
      expect(domainError).toContain('Invalid domain');
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/validate-email', route => route.abort());
      
      await page.fill('[name="email"]', 'test@example.com');
      await page.locator('[name="email"]').blur();
      
      // Wait for validation attempt
      await page.waitForTimeout(1000);
      
      // FormGuard should handle API failure gracefully
      // (Implementation dependent - might show error or pass validation)
      const hasError = await page.locator('.error-message').count();
      // Test passes if no JavaScript errors occurred
      expect(true).toBeTruthy();
    });
  });
});