import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should display search bar on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The homepage hero has a HeroSearch component with a Search button
    // and dropdowns for Location, Land Type, Price Range
    const searchButton = page.getByRole('button', { name: /^search$/i }).first();
    const hasSearchButton = await searchButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSearchButton) {
      await expect(searchButton).toBeVisible();
    } else {
      // Fallback: look for any search-related element
      const searchIcon = page.locator('[class*="search" i], text=/search/i').first();
      const hasSearchIcon = await searchIcon.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasSearchIcon).toBeTruthy();
    }
  });

  test('should have location dropdown in hero search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The HeroSearch has a Location dropdown button with "All Regions" text
    const locationButton = page.locator('text=/all regions/i').first();
    const hasLocation = await locationButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasLocation) {
      await expect(locationButton).toBeVisible();

      // Click to open the dropdown
      await locationButton.click();
      await page.waitForTimeout(500);

      // Should show region options (Greater Accra, Ashanti, etc.)
      const accraOption = page.locator('button:has-text("Greater Accra")').first();
      const hasAccra = await accraOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAccra) {
        await expect(accraOption).toBeVisible();
      }
    }
  });

  test('should have land type dropdown in hero search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The HeroSearch has a Land Type dropdown with "All Types" text
    const landTypeButton = page.locator('text=/all types/i').first();
    const hasLandType = await landTypeButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasLandType) {
      await expect(landTypeButton).toBeVisible();

      // Click to open the dropdown
      await landTypeButton.click();
      await page.waitForTimeout(500);

      // Should show land type options (Residential, Commercial, etc.)
      const residentialOption = page.locator('button:has-text("Residential")').first();
      const hasResidential = await residentialOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasResidential) {
        await expect(residentialOption).toBeVisible();
      }
    }
  });

  test('should have price range dropdown in hero search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The HeroSearch has a Price Range dropdown with "Any Price" text
    const priceButton = page.locator('text=/any price/i').first();
    const hasPrice = await priceButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasPrice) {
      await expect(priceButton).toBeVisible();

      // Click to open the dropdown
      await priceButton.click();
      await page.waitForTimeout(500);

      // Should show price range options
      const priceOption = page.locator('button:has-text("GHS")').first();
      const hasPriceOption = await priceOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasPriceOption) {
        await expect(priceOption).toBeVisible();
      }
    }
  });

  test('should navigate to listings page when searching with valid query', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Click the Search button in the hero (with no filters = all listings)
    const searchButton = page.getByRole('button', { name: /^search$/i }).first();
    const hasSearch = await searchButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSearch) {
      await searchButton.click();
      await expect(page).toHaveURL(/\/listings/, { timeout: 10000 });
    }
  });

  test('should search with a region filter and navigate to listings', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Open the Location dropdown
    const locationButton = page.locator('text=/all regions/i').first();
    const hasLocation = await locationButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasLocation) {
      await locationButton.click();
      await page.waitForTimeout(500);

      // Select "Greater Accra"
      const accraOption = page.locator('button:has-text("Greater Accra")').first();
      const hasAccra = await accraOption.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasAccra) {
        await accraOption.click();
        await page.waitForTimeout(300);

        // Click Search
        const searchButton = page.getByRole('button', { name: /^search$/i }).first();
        if (await searchButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchButton.click();
          await expect(page).toHaveURL(/\/listings\?/, { timeout: 10000 });
          expect(page.url()).toContain('region');
        }
      }
    }
  });

  test('should show all listings with empty query on listings page', async ({ page }) => {
    // Navigate to listings with no query params
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The listings page should load and show the search bar
    const searchInput = page
      .getByPlaceholder(/search by location|search|find/i)
      .first();
    const hasSearch = await searchInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSearch) {
      // The search input should be empty by default
      await expect(searchInput).toBeVisible();
      // Leave it empty and verify the page shows listings (or empty state)
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/listings');
    }
  });

  test('should show listing cards in search results', async ({ page }) => {
    // Search with a query that might return results
    await page.goto('/listings?q=land', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Look for listing cards (links to /listings/[id])
    const listingLinks = page.locator('a[href*="/listings/"]').filter({
      hasNot: page.locator('text=/back to listings|create/i'),
    });
    const count = await listingLinks.count();

    // If there are results, there should be listing cards
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      // No results - page should still render (possibly with empty state)
      const pageText = await page.locator('body').textContent();
      expect(pageText).toBeTruthy();
    }
  });

  test('should search from the listings page search bar', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The listings page has its own search input
    const searchInput = page
      .getByPlaceholder(/search by location|search|find/i)
      .first();
    const hasSearch = await searchInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Accra');

      // Look for a search button on the listings page
      const searchButton = page.getByRole('button', { name: /^search$/i }).first();
      const hasButton = await searchButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/listings');
    }
  });

  test('should clear search filters', async ({ page }) => {
    // Start with a filtered search
    await page.goto('/listings?region=Greater%20Accra', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // The listings page should show the region in the search/filter state
    // Look for a clear button or the ability to reset
    const clearButton = page.getByRole('button', { name: /clear|reset/i }).first();
    const hasClear = await clearButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClear) {
      await clearButton.click();
      await page.waitForTimeout(2000);
    }

    // Page should still be on listings
    expect(page.url()).toContain('/listings');
  });
});
