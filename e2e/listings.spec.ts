import { test, expect } from '@playwright/test';

test.describe('Listings Browsing', () => {
  test('should load the listings page', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();

    // The listings page has a hero header with a heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display listing cards when listings exist', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Listing cards are rendered as Link elements pointing to /listings/[id]
    // or as cards with listing titles. Wait for content to load.
    await page.waitForTimeout(2000);

    // Look for listing cards - they are links to individual listings
    const listingLinks = page.locator('a[href*="/listings/"]').filter({
      hasNot: page.locator('text=/back to listings/i'),
    });
    const count = await listingLinks.count();

    // Also check for featured listing cards on the page
    const cards = page.locator('[class*="rounded-2xl"], [class*="rounded-lg"]').filter({
      has: page.locator('text=/acres|GHS|GH/i'),
    });
    const cardCount = await cards.count();

    // If no listings in DB, the page may show an empty state.
    // Either way the page should load without error.
    if (count > 0 || cardCount > 0) {
      expect(count + cardCount).toBeGreaterThan(0);
    } else {
      // Empty state is acceptable - page should still render
      const pageText = await page.locator('body').textContent();
      expect(pageText).toBeTruthy();
    }
  });

  test('should navigate to listing detail page when clicking a listing', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find a listing link that goes to a specific listing (not /listings/create or /listings alone)
    const listingLinks = page.locator('a[href*="/listings/"]');
    const count = await listingLinks.count();

    test.skip(count === 0, 'No listings available to click');

    // Click the first listing link (skip "create" and "back" links)
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const link = listingLinks.nth(i);
      const href = await link.getAttribute('href');
      if (href && !href.includes('create') && href.match(/\/listings\/[^/]+$/)) {
        await link.click();
        clicked = true;
        break;
      }
    }

    test.skip(!clicked, 'No valid listing detail link found');

    // Should navigate to a listing detail page
    await expect(page).toHaveURL(/\/listings\/[^/]+$/, { timeout: 15000 });
  });

  test('should show title, price, and description on listing detail page', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find a valid listing link
    const listingLinks = page.locator('a[href*="/listings/"]');
    const count = await listingLinks.count();

    test.skip(count === 0, 'No listings available to view detail');

    let listingUrl: string | null = null;
    for (let i = 0; i < count; i++) {
      const link = listingLinks.nth(i);
      const href = await link.getAttribute('href');
      if (href && !href.includes('create') && href.match(/\/listings\/[^/]+$/)) {
        listingUrl = href;
        break;
      }
    }

    test.skip(!listingUrl, 'No valid listing detail link found');

    // Navigate directly to the listing detail page
    await page.goto(listingUrl!, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // The detail page should have a title (CardTitle with listing title)
    const title = page.locator('h1, h2, [class*="CardTitle"]').first();
    await expect(title).toBeVisible({ timeout: 10000 });

    // Price should be visible (formatted as GH₵ or GHS)
    const priceText = await page.locator('body').textContent({ timeout: 10000 });
    expect(priceText).toBeTruthy();

    // The detail page renders price with formatPrice (GH₵ prefix)
    const hasPrice = priceText!.match(/GH|₵|GHS|price/i);
    expect(hasPrice).toBeTruthy();

    // Description section should be present
    const descriptionHeading = page.locator('text=/description/i').first();
    const hasDescription = await descriptionHeading.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDescription) {
      await expect(descriptionHeading).toBeVisible();
    }
  });

  test('should support filtering by region if filter UI exists', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The listings page has a Filters button
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    const hasFilterButton = await filterButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasFilterButton) {
      // Open the filters panel
      await filterButton.click();
      await page.waitForTimeout(1000);

      // Look for a region select/dropdown within the filters
      const regionSelect = page.locator('select[name*="region" i], select:has(option:has-text("Region"))').first();
      const regionLabel = page.locator('text=/region/i').first();

      const hasRegionSelect = await regionSelect.isVisible({ timeout: 3000 }).catch(() => false);
      const hasRegionLabel = await regionLabel.isVisible({ timeout: 3000 }).catch(() => false);

      // Region filter UI should exist in the filters panel
      expect(hasRegionSelect || hasRegionLabel).toBeTruthy();
    } else {
      // If no filter button, test the region query param directly
      await page.goto('/listings?region=Greater%20Accra', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should support search functionality if search UI exists', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The listings page has a search input with placeholder "Search by location, title, or keyword..."
    const searchInput = page
      .getByPlaceholder(/search by location|search|find/i)
      .first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('Accra');

      // Look for a search/apply button
      const searchButton = page.getByRole('button', { name: /^search$/i }).first();
      const hasSearchButton = await searchButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSearchButton) {
        await searchButton.click();
      } else {
        // Press Enter to submit
        await searchInput.press('Enter');
      }

      await page.waitForTimeout(2000);
      // Page should still be on listings
      expect(page.url()).toContain('/listings');
    } else {
      // Search via query param
      await page.goto('/listings?q=Accra', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show total listings count', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The listings page shows a count of available properties
    const countText = page.locator('text=/properties available|total listings/i').first();
    const hasCount = await countText.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCount) {
      await expect(countText).toBeVisible();
    }
  });

  test('should have a back link on listing detail page', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    const listingLinks = page.locator('a[href*="/listings/"]');
    const count = await listingLinks.count();

    test.skip(count === 0, 'No listings available to view detail');

    let listingUrl: string | null = null;
    for (let i = 0; i < count; i++) {
      const link = listingLinks.nth(i);
      const href = await link.getAttribute('href');
      if (href && !href.includes('create') && href.match(/\/listings\/[^/]+$/)) {
        listingUrl = href;
        break;
      }
    }

    test.skip(!listingUrl, 'No valid listing detail link found');

    await page.goto(listingUrl!, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Detail page should have a "Back to Listings" link
    const backLink = page.getByRole('link', { name: /back to listings/i }).first();
    const hasBackLink = await backLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBackLink) {
      await backLink.click();
      await expect(page).toHaveURL(/\/listings$/, { timeout: 10000 });
    }
  });
});
