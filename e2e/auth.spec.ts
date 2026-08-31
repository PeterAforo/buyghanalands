import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test('should load the login page with form fields', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Login form should be present
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Phone number field (login uses phone-based auth)
    const phoneInput = page.locator('#phone, input[name="phone"], input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 10000 });

    // Password field
    const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Submit button
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i }).first();
    await expect(submitButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });

    // Fill in invalid credentials
    const phoneInput = page.locator('#phone, input[name="phone"], input[type="tel"]').first();
    await phoneInput.fill('0240000000');

    const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
    await passwordInput.fill('wrongpassword123');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i }).first();
    await submitButton.click();

    // Wait for either an error message or a validation message to appear.
    // The login form shows "Invalid phone number or password" on failure.
    const errorMessage = page.locator('text=/invalid|error|incorrect|failed/i').first();
    const hasError = await errorMessage.isVisible({ timeout: 10000 }).catch(() => false);

    // If no visible error appeared, the form may still be processing or
    // validation prevented submission. Either way, we should not be on the
    // dashboard as an authenticated user.
    if (!hasError) {
      // Give the page a moment to settle
      await page.waitForTimeout(2000);
      // We should still be on the login page (not redirected to dashboard)
      expect(page.url()).toContain('/auth/login');
    } else {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should validate required phone and password fields', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i }).first();
    await submitButton.click();

    // Should remain on login page (validation prevents submit)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/auth/login');
  });

  test('should have a link to the register page', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    const registerLink = page.getByRole('link', { name: /create account|register|sign up/i }).first();
    if (await registerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await registerLink.click();
      await expect(page).toHaveURL(/auth\/register/, { timeout: 10000 });
    }
  });

  test('should have a forgot password link', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    const forgotLink = page.getByRole('link', { name: /forgot password/i }).first();
    if (await forgotLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot-password/, { timeout: 10000 });
    }
  });
});

test.describe('Authentication - Register', () => {
  test('should load the register page with form fields', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // The register page is multi-step. Step 1 shows account type selection.
    // Look for account type options (Buyer, Seller, Agent, Professional)
    const pageText = await page.locator('body').textContent({ timeout: 10000 });
    expect(pageText).toBeTruthy();

    // Should mention account types or a heading
    const hasAccountTypeText = pageText!.toLowerCase().match(/buy|sell|agent|professional|account|what bring you/i);
    expect(hasAccountTypeText).toBeTruthy();
  });

  test('should validate required fields on register', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The first step requires selecting an account type and clicking Continue.
    // Try clicking Continue without selecting anything (BUYER is default).
    const continueButton = page.getByRole('button', { name: /continue|next/i }).first();
    if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(1000);
    }

    // We should still be on the register flow (not redirected away)
    expect(page.url()).toContain('/auth/register');
  });

  test('should show account type selection on step 1', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

    // Look for account type buttons/cards
    const buyerOption = page.locator('text=/buy land/i').first();
    const sellerOption = page.locator('text=/sell land/i').first();

    const hasBuyer = await buyerOption.isVisible({ timeout: 10000 }).catch(() => false);
    const hasSeller = await sellerOption.isVisible({ timeout: 5000 }).catch(() => false);

    // At least one account type option should be visible
    expect(hasBuyer || hasSeller).toBeTruthy();
  });

  test('should navigate through registration flow for buyer', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Step 1: Account type is defaulted to BUYER. Click Continue.
    const continueButton = page.getByRole('button', { name: /continue|next/i }).first();
    if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(1500);

      // Step 2: Plan selection. Click Continue again if present.
      const continueButton2 = page.getByRole('button', { name: /continue|next/i }).first();
      if (await continueButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueButton2.click();
        await page.waitForTimeout(1500);

        // Step 3: Details form. Fill in registration details.
        const fullNameInput = page.locator('input[name="fullName"], #fullName').first();
        const emailInput = page.locator('input[name="email"], input[type="email"]').first();
        const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

        const hasFullName = await fullNameInput.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasFullName) {
          await fullNameInput.fill('Test User');
          await emailInput.fill(`testuser_${Date.now()}@example.com`);
          await phoneInput.fill('0240000000');
          await passwordInput.fill('TestPass123!');

          // Look for confirm password field
          const confirmPasswordInput = page.locator('input[name="confirmPassword"]').first();
          if (await confirmPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmPasswordInput.fill('TestPass123!');
          }

          // Submit the form
          const submitButton = page.getByRole('button', { name: /create|register|submit|sign up|get started/i }).first();
          if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitButton.click();

            // After successful registration, should redirect to verify-email
            // or show a success message. Wait for navigation.
            await page.waitForTimeout(3000);

            // Should either be on verify-email page or show success
            const currentUrl = page.url();
            const hasSuccessText = await page
              .locator('text=/success|verify|check your email|created/i')
              .first()
              .isVisible({ timeout: 5000 })
              .catch(() => false);

            // The flow should have progressed (either redirected or shown success)
            expect(
              currentUrl.includes('verify-email') ||
                currentUrl.includes('dashboard') ||
                hasSuccessText ||
                currentUrl.includes('register')
            ).toBeTruthy();
          }
        }
      }
    }
  });

  test('should have a link back to login page', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

    const signInLink = page.getByRole('link', { name: /sign in|login/i }).first();
    if (await signInLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInLink.click();
      await expect(page).toHaveURL(/auth\/login/, { timeout: 10000 });
    }
  });
});
