import { test, expect } from '@playwright/test';

test.describe.serial('LogiFlows Phase 01 Authentication & RBAC E2E Journey', () => {
  const uniqueId = Date.now();
  const testEmail = `e2e_customer_${uniqueId}@logiflows.test`;
  const initialPassword = 'SecurePassword2026!';
  const newPassword = 'UpdatedPassword2026!';

  test('P1-01 & P1-02: Customer registers, receives activation email, and activates account', async ({ page, request }) => {
    // 1. Visit Register Page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create customer account/i })).toBeVisible();

    // 2. Fill registration form
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Customer');
    await page.getByLabel(/^password$/i).fill(initialPassword);
    await page.getByLabel(/confirm password/i).fill(initialPassword);

    // 3. Submit registration
    await page.getByRole('button', { name: /register account/i }).click();

    // 4. Verify confirmation card is displayed
    await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testEmail)).toBeVisible({ timeout: 15000 });

    // 5. Query Mailpit dev mail sink for activation email
    let activationToken: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const messagesRes = await request.get('http://localhost:8025/api/v1/messages');
      if (messagesRes.ok()) {
        const data = await messagesRes.json();
        const message = data.messages?.find((m: any) =>
          m.To?.some((to: any) => to.Address === testEmail) && m.Subject?.includes('Activate')
        );
        if (message) {
          // Retrieve message body
          const msgDetail = await request.get(`http://localhost:8025/api/v1/message/${message.ID}`);
          const msgJson = await msgDetail.json();
          const bodyText = msgJson.Text || msgJson.HTML || '';
          const match = bodyText.match(/token=([a-zA-Z0-9_-]+)/);
          if (match) {
            activationToken = match[1];
            break;
          }
        }
      }
      await page.waitForTimeout(1000);
    }

    expect(activationToken).not.toBeNull();

    // 6. Navigate to activation URL with token
    await page.goto(`/activate?token=${activationToken}`);
    await expect(page.getByText('Account Activated!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /proceed to sign in/i })).toBeVisible();
  });

  test('P1-03 & P1-07: User logs in, persists session across reload, and navigates protected profile', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(initialPassword);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // 2. Verified login redirects to status/dashboard
    await expect(page).toHaveURL(/\/status|\/app\/status|\/profile/);
    await expect(page.getByText('CUSTOMER', { exact: true }).first()).toBeVisible();

    // 3. Navigate to protected profile
    await page.goto('/profile');
    await expect(page.getByText('Personal & Contact Information')).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();

    // 4. Session persistence on full browser reload (silent refresh via HttpOnly cookie)
    await page.reload();
    await expect(page.getByText('Personal & Contact Information')).toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test('P1-05: User views and updates profile attributes', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(initialPassword);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByText('CUSTOMER', { exact: true }).first()).toBeVisible();

    // Visit profile
    await page.goto('/profile');
    await page.getByLabel(/phone number/i).fill('+1 555-888-9999');
    await page.getByRole('button', { name: /save profile changes/i }).click();

    // Success notice appears
    await expect(page.getByText('Profile attributes saved successfully.')).toBeVisible();
  });

  test('P1-04: User changes password and verifies old password rejection', async ({ page }) => {
    // Login with initial password
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(initialPassword);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByText('CUSTOMER', { exact: true }).first()).toBeVisible();

    // Visit Profile security tab
    await page.goto('/profile');
    await page.getByRole('button', { name: /security & password/i }).click();

    // Fill change password form
    await page.getByLabel(/current password/i).fill(initialPassword);
    await page.getByLabel(/^new password$/i).fill(newPassword);
    await page.getByLabel(/confirm new password/i).fill(newPassword);
    await page.getByRole('button', { name: /update password/i }).click();

    await expect(page.getByText('Password changed successfully.')).toBeVisible();

    // Logout
    const signOutBtn = page.getByTitle('Sign Out');
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
    } else {
      await page.goto('/login');
    }

    // Try logging in with old password -> should fail
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(initialPassword);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // Login with new password -> succeeds
    await page.getByLabel(/^password$/i).fill(newPassword);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByText('CUSTOMER', { exact: true }).first()).toBeVisible();
  });

  test('P1-07: Unauthenticated access to /profile redirects to /login', async ({ page, context }) => {
    // Clear cookies
    await context.clearCookies();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
    await expect(page.getByRole('heading', { name: /sign in to logiflows/i })).toBeVisible();
  });

  test('P1-07: Direct access to /unauthorized renders 403 Access Denied explanation', async ({ page }) => {
    await page.goto('/unauthorized');
    await expect(page.getByText('403 - Access Denied')).toBeVisible();
    await expect(page.getByText('You do not possess the required RBAC role permissions', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /go to dashboard/i })).toBeVisible();
  });
});
