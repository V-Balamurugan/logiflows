import { test, expect } from '@playwright/test';

test.describe('LogiFlows Phase 00 Browser Smoke Tests', () => {
  test('Landing page loads with brand header, hero, and planned features', async ({ page }) => {
    await page.goto('/');

    // Check title and heading
    await expect(page).toHaveTitle(/LogiFlows/i);
    await expect(page.locator('h1')).toContainText('Logistics Management');

    // Check planned features section
    await expect(page.getByText('Upcoming Modules in Future Phases')).toBeVisible();
    await expect(page.getByText('Multi-Tenant Organization Management')).toBeVisible();
  });

  test('Navigation from landing page to development status page works', async ({ page }) => {
    await page.goto('/');

    // Click Launch Dev Console / Dev Status link
    const statusLink = page.getByRole('link', { name: /Dev Status/i }).first();
    await statusLink.click();

    // Verify URL and Status Page header
    await expect(page).toHaveURL(/\/app\/status/);
    await expect(page.getByText('Development Status & Telemetry')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Django REST API' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PostgreSQL 16' })).toBeVisible();
  });

  test('Navigation to 12-Phase architecture roadmap works', async ({ page }) => {
    await page.goto('/app/architecture');

    await expect(page.getByText('System Architecture & 12-Phase Roadmap')).toBeVisible();
    await expect(page.getByText('Phase 00', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Phase 01', { exact: true }).first()).toBeVisible();
  });

  test('Direct 404 error routing works', async ({ page }) => {
    await page.goto('/invalid-non-existent-route');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});
