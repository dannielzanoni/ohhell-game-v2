import { expect, test } from '@playwright/test';

test.describe('game mode selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('offers entry points for the classic and Hell Hand games', async ({ page }) => {
    await expect(page.locator('a[href="/classic"]')).toBeVisible();
    await expect(page.locator('a[href="/hell-hand"]')).toBeVisible();
  });

  test('opens the classic home', async ({ page }) => {
    await page.locator('a[href="/classic"]').click();

    await expect(page).toHaveURL(/\/classic$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('opens the Hell Hand home', async ({ page }) => {
    await page.locator('a[href="/hell-hand"]').click();

    await expect(page).toHaveURL(/\/hell-hand$/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('standardized routes', () => {
  test('keeps legacy classic links working through redirects', async ({ page }) => {
    await page.goto('/home');

    await expect(page).toHaveURL(/\/classic$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('redirects the old Hell Hand setup route', async ({ page }) => {
    await page.goto('/hell-hand/game');

    await expect(page).toHaveURL(/\/hell-hand\/create-game$/);
  });

  test('keeps development tools under the dev namespace', async ({ page }) => {
    await page.goto('/playground');

    await expect(page).toHaveURL(/\/dev\/hell-hand\/card-editor$/);
  });
});
