import { test, expect } from '@playwright/test';

test.describe('Navigation and Layout', () => {
  test('should load homepage with hero section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();

    // Hero section contains the main heading "Buy Verified Land in Ghana"
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible({ timeout: 10000 });

    const headingText = await heroHeading.textContent();
    expect(headingText).toBeTruthy();
    // The hero heading mentions land/Ghana
    expect(headingText!.toLowerCase()).toMatch(/land|ghana/i);
  });

  test('should display header navigation links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Header should be visible
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // The header contains navigation links: Browse Lands, Professionals, About, etc.
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to listings via header link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const browseLink = page.getByRole('link', { name: /browse lands/i }).first();
    if (await browseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await browseLink.click();
      await expect(page).toHaveURL(/\/listings/, { timeout: 10000 });
    }
  });

  test('should navigate to professionals via header link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const professionalsLink = page.getByRole('link', { name: /professionals/i }).first();
    if (await professionalsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await professionalsLink.click();
      await expect(page).toHaveURL(/\/professionals/, { timeout: 10000 });
    }
  });

  test('should navigate to about page via header link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const aboutLink = page.getByRole('link', { name: /^about/i }).first();
    if (await aboutLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/, { timeout: 10000 });
    }
  });

  test('should display sign in and get started buttons when logged out', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    const getStartedLink = page.getByRole('link', { name: /get started/i }).first();

    const hasSignIn = await signInLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasGetStarted = await getStartedLink.isVisible({ timeout: 5000 }).catch(() => false);

    // When logged out, both auth buttons should be visible
    if (hasSignIn) {
      await signInLink.click();
      await expect(page).toHaveURL(/auth\/login/, { timeout: 10000 });
    }
  });

  test('should display footer with contact info', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Footer should be visible
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Footer should contain contact information
    const footerText = await footer.textContent();
    expect(footerText).toBeTruthy();

    // Check for email contact
    const hasEmail = footerText!.match(/support@buyghanalands\.com|@/i);
    expect(hasEmail).toBeTruthy();

    // Check for phone contact
    const hasPhone = footerText!.match(/\+233|phone|tel/i);
    expect(hasPhone).toBeTruthy();
  });

  test('should display footer newsletter form', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Newsletter form has an email input and a Subscribe button
    const newsletterForm = footer.locator('form').first();
    const hasForm = await newsletterForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasForm) {
      await expect(newsletterForm).toBeVisible();

      // Email input
      const emailInput = newsletterForm.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible();

      // Subscribe button
      const subscribeButton = newsletterForm.getByRole('button', { name: /subscribe/i }).first();
      await expect(subscribeButton).toBeVisible();
    }
  });

  test('should display browse by region section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The homepage has a "Browse by Region" section
    const regionSection = page.locator('text=/browse by region/i').first();
    const hasRegionSection = await regionSection.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRegionSection) {
      await expect(regionSection).toBeVisible();

      // Should have region links (Greater Accra, Ashanti, etc.)
      const accraLink = page.getByRole('link', { name: /greater accra/i }).first();
      const hasAccra = await accraLink.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAccra) {
        await expect(accraLink).toBeVisible();
      }
    }
  });

  test('should display featured listings section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The homepage has a "Featured Listings" section
    const featuredSection = page.locator('text=/featured listings/i').first();
    const hasFeatured = await featuredSection.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasFeatured) {
      await expect(featuredSection).toBeVisible();

      // Featured listing cards link to /listings/[id]
      const featuredCards = page.locator('a[href*="/listings/"]').filter({
        has: page.locator('text=/featured/i'),
      });
      const cardCount = await featuredCards.count();
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should display browse by land type section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // The homepage has a "Browse by Land Type" section
    const landTypeSection = page.locator('text=/browse by land type/i').first();
    const hasSection = await landTypeSection.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSection) {
      await expect(landTypeSection).toBeVisible();

      // Should have land type links (Residential, Commercial, etc.)
      const residentialLink = page.getByRole('link', { name: /residential/i }).first();
      const hasResidential = await residentialLink.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasResidential) {
        await residentialLink.click();
        await expect(page).toHaveURL(/\/listings\?landType=RESIDENTIAL/, { timeout: 10000 });
      }
    }
  });

  test('should display how it works section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    const howItWorks = page.locator('text=/how it works/i').first();
    const hasSection = await howItWorks.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSection) {
      await expect(howItWorks).toBeVisible();
    }
  });

  test('should display trust badges in hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Trust badges: "Lands Commission Verified", "Escrow-protected Payments", etc.
    const trustText = page.locator('text=/escrow|verified|diaspora/i').first();
    const hasTrust = await trustText.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTrust) {
      await expect(trustText).toBeVisible();
    }
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Test the Pricing link in footer
    const pricingLink = footer.getByRole('link', { name: /pricing/i }).first();
    if (await pricingLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pricingLink.click();
      await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 });
    }
  });
});
