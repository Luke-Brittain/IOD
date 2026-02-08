const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:5174/');
    await page.waitForSelector('text=Node 1', { timeout: 5000 });
    const node = await page.locator('text=Node 1').first();
    const box = await node.boundingBox();
    if (!box) throw new Error('Node bounding box not found');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 10 });
    await page.mouse.up();

    // read computed style
    const pos = await node.evaluate((el) => ({ left: el.style.left, top: el.style.top }));
    console.log('Node style after drag:', pos);
  } catch (err) {
    console.error('Error during run:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
