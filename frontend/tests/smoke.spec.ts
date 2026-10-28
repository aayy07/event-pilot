import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'replace-with-a-strong-password';

test('admin can create an event and participant access is restricted to @sc.com', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();

  await page.getByLabel('Email address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible();

  await page.getByRole('button', { name: /create event/i }).first().click();
  await page.getByLabel('Event name').fill('Leadership Summit');
  await page.getByLabel('Event date').fill('2027-02-12');
  await page.getByLabel('Start time').fill('09:30');
  await page.getByLabel('Venue').fill('London HQ');
  await page.getByLabel('Event details').fill('A private event for invited colleagues and partners.');
  await page.getByRole('button', { name: /create event & registration link/i }).click();

  await expect(page.getByText('Event created. Your registration link and QR are ready.')).toBeVisible();
  const registrationLink = (await page.locator('.share-link-text').textContent())?.trim();
  expect(registrationLink).toContain('/register/');

  await page.goto(registrationLink!);
  await expect(page.getByRole('heading', { name: 'Join the event.' })).toBeVisible();

  await page.getByLabel('Full name').fill('Alicia Grant');
  await page.getByLabel('Work email').fill('alicia@sc.com');
  await page.getByRole('button', { name: /continue to event details/i }).click();

  await expect(page.getByText('Access approved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Leadership Summit' })).toBeVisible();

  await page.goto(registrationLink!);
  await page.getByLabel('Full name').fill('Zack Smith');
  await page.getByLabel('Work email').fill('zack@gmail.com');
  await page.getByRole('button', { name: /continue to event details/i }).click();

  await expect(page.getByText('Registration is limited to @sc.com email addresses.')).toBeVisible();
});

test('admin can copy the registration link and QR in one share action', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (items: ClipboardItem[]) => {
          (window as typeof window & { copiedClipboardItems?: ClipboardItem[] }).copiedClipboardItems = items;
        },
        read: async () => new Uint8Array(),
      },
    });
  });

  await page.goto('/');
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.getByRole('button', { name: /create event/i }).first().click();
  await page.getByLabel('Event name').fill('Investor Briefing');
  await page.getByLabel('Event date').fill('2027-05-20');
  await page.getByLabel('Start time').fill('15:00');
  await page.getByLabel('Venue').fill('Manchester Office');
  await page.getByLabel('Event details').fill('Invite-only investor briefing with the regional leadership team.');
  await page.getByRole('button', { name: /create event & registration link/i }).click();

  const registrationLink = (await page.locator('.share-link-text').textContent())?.trim();
  await page.getByRole('button', { name: /copy link \+ qr/i }).click();
  await expect(page.getByText('Registration link and high-resolution QR copied.')).toBeVisible();

  const copiedShare = await page.evaluate(async () => {
    const item = (window as typeof window & { copiedClipboardItems?: ClipboardItem[] }).copiedClipboardItems?.[0];
    if (!item) return null;
    const text = await (await item.getType('text/plain')).text();
    const html = await (await item.getType('text/html')).text();
    const image = await createImageBitmap(await item.getType('image/png'));
    return { types: item.types, text, html, width: image.width, height: image.height };
  });

  expect(copiedShare?.types).toEqual(expect.arrayContaining(['text/plain', 'text/html', 'image/png']));
  expect(copiedShare?.text).toContain(registrationLink);
  expect(copiedShare?.html).toContain(registrationLink);
  expect(copiedShare?.width).toBeGreaterThanOrEqual(1000);
  expect(copiedShare?.height).toBeGreaterThanOrEqual(800);
});

test('mobile sign-in view stays usable on narrow screens', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

  await context.close();
});
