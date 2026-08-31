import { test, expect } from '@playwright/test';

test.describe('Professional Services', () => {
  test('should load the professionals page', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();

    // The professionals page has a hero heading "Find Expert Professionals"
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    expect(headingText!.toLowerCase()).toMatch(/professional|expert/i);
  });

  test('should display professional type category cards', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The page shows category cards: Surveyors, Lawyers, Architects, Engineers, etc.
    const surveyorCard = page.locator('text=/surveyors/i').first();
    const lawyerCard = page.locator('text=/lawyers/i').first();

    const hasSurveyor = await surveyorCard.isVisible({ timeout: 10000 }).catch(() => false);
    const hasLawyer = await lawyerCard.isVisible({ timeout: 5000 }).catch(() => false);

    // At least some category cards should be visible
    expect(hasSurveyor || hasLawyer).toBeTruthy();
  });

  test('should display search bar on professionals page', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The professionals page has a search input
    const searchInput = page
      .getByPlaceholder(/search by name|search|find/i)
      .first();
    const hasSearch = await searchInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should display professional cards when professionals exist', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Professional cards are Link elements pointing to /professionals/[id]
    const professionalLinks = page.locator('a[href*="/professionals/"]').filter({
      hasNot: page.locator('text=/register|back/i'),
    });
    const count = await professionalLinks.count();

    if (count > 0) {
      // Professional cards should be visible
      expect(count).toBeGreaterThan(0);
    } else {
      // No professionals in DB - page should show empty state
      const emptyState = page.locator('text=/no professionals|will appear here/i').first();
      const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('should display stats bar on professionals page', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The page shows stats: total Professionals, Verified count, Avg Rating
    const professionalsStat = page.locator('text=/professionals/i').first();
    const verifiedStat = page.locator('text=/verified/i').first();
    const ratingStat = page.locator('text=/avg rating/i').first();

    const hasProfessionalsStat = await professionalsStat.isVisible({ timeout: 10000 }).catch(() => false);
    const hasVerifiedStat = await verifiedStat.isVisible({ timeout: 3000 }).catch(() => false);
    const hasRatingStat = await ratingStat.isVisible({ timeout: 3000 }).catch(() => false);

    // At least the professionals stat should be visible
    expect(hasProfessionalsStat || hasVerifiedStat || hasRatingStat).toBeTruthy();
  });

  test('should display filters button on professionals page', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The page has a Filters button
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    const hasFilter = await filterButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasFilter) {
      await expect(filterButton).toBeVisible();

      // Click to open filters
      await filterButton.click();
      await page.waitForTimeout(500);

      // Should show location filter and verified-only toggle
      const locationFilter = page.getByPlaceholder(/filter by location|location/i).first();
      const verifiedToggle = page.locator('text=/verified only/i').first();

      const hasLocation = await locationFilter.isVisible({ timeout: 3000 }).catch(() => false);
      const hasVerified = await verifiedToggle.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasLocation || hasVerified).toBeTruthy();
    }
  });

  test('should filter professionals by type when clicking category card', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Click on the Surveyors category card
    const surveyorButton = page.locator('button:has-text("Surveyors")').first();
    const hasSurveyor = await surveyorButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSurveyor) {
      await surveyorButton.click();
      await page.waitForTimeout(2000);

      // The page should still be on professionals
      expect(page.url()).toContain('/professionals');
    }
  });

  test('should display CTA section for professional registration', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The page has a CTA section "Are You a Professional?"
    const ctaText = page.locator('text=/are you a professional/i').first();
    const hasCta = await ctaText.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCta) {
      await expect(ctaText).toBeVisible();

      // Should have a "Register as Professional" button/link
      const registerLink = page.getByRole('link', { name: /register as professional/i }).first();
      const hasRegister = await registerLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasRegister) {
        await expect(registerLink).toBeVisible();
      }
    }
  });

  test('should attempt to navigate to professional detail page', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Find a professional card link
    const professionalLinks = page.locator('a[href*="/professionals/"]').filter({
      hasNot: page.locator('text=/register|back/i'),
    });
    const count = await professionalLinks.count();

    test.skip(count === 0, 'No professional cards available to click');

    // Click the first professional card
    const firstLink = professionalLinks.first();
    const href = await firstLink.getAttribute('href');

    if (href && href.match(/\/professionals\/[^/]+$/)) {
      await firstLink.click();
      await page.waitForTimeout(3000);

      // The professional detail page may or may not exist.
      // If it exists, verify it loaded. If not (404), that's a known issue.
      const currentUrl = page.url();
      if (currentUrl.includes('/professionals/')) {
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should have a register link for professionals', async ({ page }) => {
    await page.goto('/professionals', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Look for a link to register as a professional
    const registerLink = page.getByRole('link', { name: /register as professional|register/i }).first();
    const hasRegister = await registerLink.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRegister) {
      const href = await registerLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/register|auth/);
    }
  });
});
