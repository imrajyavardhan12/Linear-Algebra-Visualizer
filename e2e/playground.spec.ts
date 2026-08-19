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

test('shows an active handle state during pointer dragging', async ({ page }) => {
  await page.goto('/');
  const endpoint = page.locator('.vector-1 .vector-endpoint');
  const box = await endpoint.boundingBox();
  if (!box) throw new Error('u₁ endpoint was not rendered');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator('.vector-1 .vector-handle')).toHaveClass(/is-active/);
  await page.mouse.up();
  await expect(page.locator('.vector-1 .vector-handle')).not.toHaveClass(/is-active/);
});

test('supports keyboard nudging and prevents movement when locked', async ({ page }) => {
  await page.goto('/');
  const handle = page.locator('.vector-1 .vector-handle');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('spinbutton', { name: 'u₁ x coordinate' })).toHaveValue('2.1');

  await page.getByRole('button', { name: 'Lock u₁' }).click();
  await expect(page.getByRole('spinbutton', { name: 'u₁ x coordinate' })).toBeDisabled();
  await expect(handle).toHaveAttribute('tabindex', '-1');
});

test('combination controls reveal a resultant construction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await expect(page.getByText('Result w')).toBeVisible();
  await page.getByRole('slider', { name: 'Coefficient a' }).fill('2');
  await expect(page.locator('.combination-calculation').getByText(/2u₁ =/)).toBeVisible();
});

test('selects and shares explicit vector pairs by identity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a vector' }).click();
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await page.getByRole('switch', { name: 'Show dot product and projection' }).click();

  await page.getByRole('combobox', { name: 'Vector for coefficient a' }).selectOption('u3');
  await page.getByRole('combobox', { name: 'Projection target' }).selectOption('u3');

  await expect(page.locator('.combination-equation')).toHaveText('w = u₃ + u₂ = (-2, 3)');
  await expect(page.getByText('u₁ · u₃')).toBeVisible();
  await expect(page).toHaveURL(/comboPair=u3%2Cu2/);
  await expect(page).toHaveURL(/projectionPair=u1%2Cu3/);

  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Vector for coefficient a' })).toHaveValue('u3');
  await expect(page.getByRole('combobox', { name: 'Projection target' })).toHaveValue('u3');
});

test('visualizes the determinant as parallelogram area', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('area = |det| = 5')).toBeVisible();

  await page.getByRole('spinbutton', { name: 'u₁ x coordinate' }).fill('1');
  await page.getByRole('spinbutton', { name: 'u₁ y coordinate' }).fill('0');
  await page.getByRole('spinbutton', { name: 'u₂ x coordinate' }).fill('0');
  await page.getByRole('spinbutton', { name: 'u₂ y coordinate' }).fill('1');
  await expect(page.getByText('area = |det| = 1')).toBeVisible();
});

test('reveals dot product, angle, and projection geometry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Show dot product and projection' }).click();

  await expect(page.getByText('u₁ · u₂')).toBeVisible();
  await expect(page.getByText('Orthogonal')).toBeVisible();
  await expect(page.getByText('90°', { exact: true })).toBeVisible();
  await expect(page.locator('.projection-overlay')).toBeVisible();
  await expect(page.getByText('Projection of u₁ onto u₂')).toBeVisible();
});

test('shows the complete worked example for negative coefficients', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await page.getByRole('spinbutton', { name: 'a exact value' }).fill('2');
  await page.getByRole('spinbutton', { name: 'b exact value' }).fill('-1');

  await expect(page.locator('.combination-equation')).toHaveText('w = 2u₁ − u₂ = (5, 0)');
  await expect(page.locator('.combination-overlay')).toBeVisible();
  await expect(page.getByText('Result w')).toBeVisible();
});

test('makes zero components explicit and signals off-canvas results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await page.getByRole('spinbutton', { name: 'a exact value' }).fill('0');
  await expect(page.locator('.combination-zero-marker')).toHaveCount(1);

  await page.getByRole('spinbutton', { name: 'a exact value' }).fill('5');
  await page.getByRole('spinbutton', { name: 'b exact value' }).fill('5');
  await expect(page.locator('.combination-overflow-note')).toBeVisible();
});

test('hiding a vector removes it from the active analysis and legend', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Hide u₂' }).click();

  await expect(page.getByRole('heading', { name: 'Linearly independent' })).toBeVisible();
  await expect(page.getByText('span{u₁} = a line through the origin.')).toBeVisible();
  await expect(page.locator('.plane-legend')).not.toContainText('u₂');
});

test('keeps combination labels and colors tied to vector identity after removal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a vector' }).click();
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await page.getByRole('button', { name: 'Remove u₁' }).click();

  await expect(page.locator('.combination-equation')).toHaveText('w = u₂ + u₃ = (-2, 3)');
  await expect(page.locator('#arrow-u2 path')).toHaveAttribute('fill', '#9b8cff');
  await expect(page.locator('.plane-legend')).toContainText('u₂');
  await expect(page.locator('.plane-legend')).toContainText('u₃');
});

test('reset scene restores scene toggles and vector state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('checkbox', { name: /Show standard basis/ }).check();
  await page.getByRole('button', { name: 'Hide u₁' }).click();
  await page.getByRole('button', { name: 'Reset scene' }).click();

  await expect(page.getByRole('checkbox', { name: /Show standard basis/ })).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Hide u₁' })).toBeVisible();
  await expect(page.locator('.vector-1 .vector-coordinate')).toContainText('(2, 1)');
});

test('restores a complete scene from a share URL', async ({ page }) => {
  await page.goto('/?scene=1&ids=u1%2Cu2&u1=1%2C0&u2=0%2C1&a=2&b=-1&combo=1&basis=1&projection=1');

  await expect(page.locator('.combination-equation')).toHaveText('w = 2u₁ − u₂ = (2, -1)');
  await expect(page.locator('.standard-basis-overlay')).toBeVisible();
  await expect(page.locator('.projection-overlay')).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'u₁ x coordinate' })).toHaveValue('1');
});

test('copies the current scene link without unrelated URL fragments', async ({ page }) => {
  await page.goto('/#do-not-share');
  await expect(page).not.toHaveURL(/#do-not-share/);
  const shareButton = page.getByRole('button', { name: 'Copy share link' });
  await shareButton.click();
  await expect(page.getByRole('button', { name: 'Share link copied' })).toBeVisible();
});

test('quick scenes place the user at meaningful mathematical states', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Standard basis' }).click();
  await expect(page.locator('.projection-overlay')).toBeVisible();

  await page.getByRole('button', { name: 'Dependent pair' }).click();
  await expect(page.getByRole('heading', { name: 'Linearly dependent' })).toBeVisible();

  await page.getByRole('button', { name: 'Nearly dependent' }).click();
  await expect(page.getByRole('heading', { name: 'Nearly dependent' })).toBeVisible();

  await page.getByRole('button', { name: 'Three-vector relation' }).click();
  await expect(page.getByText('One vector is a combination of the others.')).toBeVisible();
});

test('rejects hostile scene content and avoids third-party runtime requests', async ({ page }) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') thirdPartyRequests.push(url.origin);
  });

  const payload = '<img src=x onerror="window.__xssProbe=1">';
  await page.addInitScript(() => {
    Object.defineProperty(window, '__xssProbe', { value: 0, writable: true });
  });
  await page.goto(`/?scene=1&ids=u1%2C${encodeURIComponent(payload)}&u1=2%2C1`);
  await page.evaluate(() => document.fonts.ready);

  expect(await page.evaluate(() => Reflect.get(window, '__xssProbe'))).toBe(0);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(thirdPartyRequests).toEqual([]);

  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("script-src 'self'");
  expect(policy).toContain("object-src 'none'");
});

test('keeps the primary playground layout visually stable', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('A fixed viewport is required for visual regression testing');
  const screenshotHeight = testInfo.project.name === 'mobile' ? 2700 : 2000;

  await expect(page).toHaveScreenshot('playground.png', {
    animations: 'disabled',
    caret: 'hide',
    clip: { x: 0, y: 0, width: viewport.width, height: screenshotHeight },
    maxDiffPixelRatio: testInfo.project.name === 'mobile' ? 0.055 : 0.02,
  });
});

