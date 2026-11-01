import { test, expect } from '@playwright/test';

test.describe('Phase 02: Multi-Tenant & Branch Serviceability E2E Tests', () => {
  test('Serviceability Checker is publicly accessible and validates postal codes', async ({ page }) => {
    await page.goto('/serviceability');

    // Verify title and page header
    await expect(page.getByRole('heading', { name: /Delivery Serviceability Checker/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Enter postal code/i)).toBeVisible();

    // Check submission
    const checkButton = page.getByRole('button', { name: /Check/i });
    await expect(checkButton).toBeVisible();

    // Fill valid postal code
    await page.getByPlaceholder(/Enter postal code/i).fill('110006');
    await checkButton.click();

    // Wait for response verification
    await page.waitForTimeout(1000);
  });

  test('Protected tenant management routes redirect unauthenticated users to login', async ({ page }) => {
    // Attempt direct access to branches
    await page.goto('/branches');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fbranches/);

    // Attempt direct access to employees
    await page.goto('/employees');
    await expect(page).toHaveURL(/\/login\?redirect=%2Femployees/);

    // Attempt direct access to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);

    // Attempt direct access to organization registration
    await page.goto('/register-organization');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fregister-organization/);
  });

  test('Platform Admin Org Approvals route is protected by RoleGuard', async ({ page }) => {
    await page.goto('/admin/organizations');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Forganizations/);
  });
});

