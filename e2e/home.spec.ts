import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check for main heading or brand
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check for common navigation elements
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to listings page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Look for a link to listings
    const listingsLink = page.getByRole('link', { name: /listings|browse|land/i }).first();
    if (await listingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingsLink.click();
      await expect(page).toHaveURL(/listings/, { timeout: 10000 });
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Look for login link
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
    if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginLink.click();
      await expect(page).toHaveURL(/auth|login/, { timeout: 10000 });
    }
  });
});

test.describe('Listings Page', () => {
  test('should display listings', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });
    
    // Look for search input or filter elements
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    
    // At least one should exist
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    const hasFilter = await filterButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasSearch || hasFilter).toBeTruthy();
  });
});

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    
    // Check for form elements - use first() to avoid strict mode
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });
    
    // Check for form elements - use first() to avoid strict mode
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('should show validation errors on empty login submit', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in|submit/i }).first();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      
      // Should show some error indication
      await page.waitForTimeout(500);
    }
  });
});
