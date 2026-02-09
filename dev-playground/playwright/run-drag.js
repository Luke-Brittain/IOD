const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('PAGE_ERROR:', err));
  try {
    await context.tracing.start({ screenshots: true, snapshots: true });
    const urls = ['http://127.0.0.1:5174/','http://localhost:5174/','http://[::1]:5174/'];
    let connected = false;
    const maxAttempts = 20;
    for (let attempt = 1; attempt <= maxAttempts && !connected; attempt++) {
      for (const u of urls) {
        try {
          await page.goto(u, { timeout: 2000, waitUntil: 'load' });
          connected = true;
          console.log('Connected to', u, 'on attempt', attempt);
          break;
        } catch (err) {
          // try next address
        }
      }
      if (!connected) await new Promise(r => setTimeout(r, 500));
    }
    if (!connected) throw new Error('Unable to connect to dev server on any loopback address');
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
    // save screenshot and trace
    try {
      await page.screenshot({ path: 'playwright/screenshot.png', fullPage: true });
      await context.tracing.stop({ path: 'playwright/trace.zip' });
      console.log('Saved screenshot to playwright/screenshot.png and trace to playwright/trace.zip');
    } catch (e) {
      console.warn('Failed to save artifacts:', e.message);
    }
  } catch (err) {
    console.error('Error during run:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
