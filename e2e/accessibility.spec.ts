import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.flatMap((node) => node.target),
  }));

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test('default playground has no detectable WCAG A or AA violations', async ({ page }) => {
  await page.goto('/');
  await expectNoAccessibilityViolations(page);
});

test('expanded relationship controls have no detectable WCAG A or AA violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a vector' }).click();
  await page.getByRole('switch', { name: 'Show linear combination' }).click();
  await page.getByRole('switch', { name: 'Show dot product and projection' }).click();
  await page.getByRole('switch', { name: 'Show change of basis' }).click();
  await page.getByRole('checkbox', { name: /Show standard basis/ }).check();
  await page.getByRole('banner').getByRole('button', { name: 'Switch to light theme' }).click();

  await expectNoAccessibilityViolations(page);
});
