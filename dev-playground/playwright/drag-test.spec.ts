import { test, expect } from '@playwright/test';

// This test assumes the dev server is running at http://localhost:5174/
// It will locate a node element by text and perform drag interactions.

test('canvas drag interaction', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  // wait for nodes to render
  await page.waitForSelector('text=Node');

  const node = await page.locator('text=Node 1').first();
  const box = await node.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  // pointer down
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // drag by 100px right and 40px down
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();

  // small pause to allow onNodeMove to run
  await page.waitForTimeout(200);

  // verify that node moved by checking its new position in DOM (style.left/top)
  const moved = await node.evaluate((el) => {
    return { left: el.style.left, top: el.style.top };
  });
  expect(moved.left).not.toBe('');
});
