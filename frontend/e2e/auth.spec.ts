import { expect, test } from '@playwright/test';

test('customer registers, adds a pet, browses a caretaker, and requests a booking', async ({
  page,
}) => {
  const apiRequests: { path: string; hasAuthorization: boolean; hasCsrf: boolean }[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) return;
    const headers = request.headers();
    apiRequests.push({
      path: url.pathname,
      hasAuthorization: Boolean(headers['authorization']),
      hasCsrf: Boolean(headers['x-csrf-token']),
    });
  });

  const email = `phase0-e2e-customer-${Date.now()}@example.test`;
  const password = 'Phase0Customer!Pass';
  await page.goto('/register');
  await page.getByLabel('Your name').fill('Phase Zero Customer');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const registrationResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/register' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /create account/i }).click();
  expect((await registrationResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/bookings$/);

  await page.goto('/app/pets');
  await page.getByLabel('Name', { exact: true }).fill('Milo');
  await page.getByLabel('Species').selectOption('Dog');
  await page.getByLabel('Breed').fill('Indie');
  const petResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/pets' && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Save pet' }).click();
  expect((await petResponse).ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Milo' })).toBeVisible();

  await page.goto('/caretakers');
  const profileResponse = page.waitForResponse((response) =>
    /^\/api\/caretakers\/\d+$/.test(new URL(response.url()).pathname),
  );
  await page.getByRole('link', { name: /view profile/i }).click();
  expect((await profileResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Phase Zero Test Caretaker' })).toBeVisible();
  await page.getByLabel('Your pet').selectOption({ label: 'Milo' });
  await page.getByLabel('Service').selectOption({ label: 'Pet walking' });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 2);
  const date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Start time').fill('10:00');
  await page.getByLabel('Pune address / area').fill('Baner');

  const createdBooking = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/bookings' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /send booking request/i }).click();
  const bookingResponse = await createdBooking;
  expect(bookingResponse.ok()).toBeTruthy();
  expect((await bookingResponse.json()).status).toBe('PENDING_PAYMENT');
  await expect(page.getByRole('status')).toContainText('Booking request sent');

  await page.goto('/app/bookings');
  await expect(page.getByText('Pending payment', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /pay securely/i }).click();
  await expect(page.getByText(/online payment service is not configured/i)).toBeVisible();

  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/login' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /log in/i }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/bookings$/);
  await expect(page.getByRole('heading', { name: 'Your bookings' })).toBeVisible();

  expect(
    apiRequests.some((request) => request.path === '/api/pets' && request.hasAuthorization),
  ).toBe(true);
  expect(apiRequests.some((request) => request.path === '/api/auth/login')).toBe(true);
  expect(
    apiRequests.some((request) => request.path === '/api/auth/me' && request.hasAuthorization),
  ).toBe(true);
  expect(apiRequests.every((request) => !request.hasCsrf)).toBe(true);
});
