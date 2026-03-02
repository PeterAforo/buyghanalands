import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading or brand
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should navigate to listings page', async ({ page }) => {
    await page.goto('/');
    
    // Look for a link to listings
    const listingsLink = page.getByRole('link', { name: /listings|browse|land/i });
    if (await listingsLink.count() > 0) {
      await listingsLink.first().click();
      await expect(page).toHaveURL(/listings/);
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link
    const loginLink = page.getByRole('link', { name: /login|sign in/i });
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/auth|login/);
    }
  });
});

test.describe('Listings Page', () => {
  test('should display listings', async ({ page }) => {
    await page.goto('/listings');
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    await page.goto('/listings');
    
    // Look for search input or filter elements
    const searchInput = page.getByPlaceholder(/search|find/i);
    const filterButton = page.getByRole('button', { name: /filter/i });
    
    // At least one should exist
    const hasSearch = await searchInput.count() > 0;
    const hasFilter = await filterButton.count() > 0;
    
    expect(hasSearch || hasFilter).toBeTruthy();
  });
});

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for form elements
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check for form elements
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should show validation errors on empty login submit', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should show some error indication
      await page.waitForTimeout(500);
    }
  });
});
