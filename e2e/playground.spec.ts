import { expect, test } from '@playwright/test';

test('updates dependence and basis status from coordinate inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Linearly independent' })).toBeVisible();

  const u1x = page.getByRole('spinbutton', { name: 'u₁ x coordinate' });
  const u1y = page.getByRole('spinbutton', { name: 'u₁ y coordinate' });
  const u2x = page.getByRole('spinbutton', { name: 'u₂ x coordinate' });
  const u2y = page.getByRole('spinbutton', { name: 'u₂ y coordinate' });
  await u1x.fill('1');
  await u1y.fill('2');
  await u2x.fill('2');
  await u2y.fill('4');

  await expect(page.getByRole('heading', { name: 'Linearly dependent' })).toBeVisible();
  await expect(page.getByText('span{u₁, u₂} = a line.')).toBeVisible();

  await u2x.fill('0');
  await u2y.fill('1');
  await expect(page.getByRole('heading', { name: 'Linearly independent' })).toBeVisible();
  await expect(page.getByText('This is a basis of R²')).toBeVisible();
});

test('dragging an endpoint keeps the coordinate editor synchronized', async ({ page }) => {
  await page.goto('/');
  const endpoint = page.locator('.vector-1 .vector-endpoint');
  const box = await endpoint.boundingBox();
  if (!box) throw new Error('u₁ endpoint was not rendered');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 45, box.y - 35, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByRole('spinbutton', { name: 'u₁ x coordinate' })).not.toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'u₁ y coordinate' })).not.toHaveValue('1');
});

test('combination controls reveal a resultant construction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await expect(page.getByText('Result w')).toBeVisible();
  await page.getByRole('slider', { name: 'Coefficient a' }).fill('2');
  await expect(page.locator('.combination-calculation').getByText(/2u₁ =/)).toBeVisible();
});

