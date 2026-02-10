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
          await page.goto(u, { timeout: 10000, waitUntil: 'networkidle' });
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
    // wait for UI labels inside the SVG and pick the first visible label as target
    const svgTexts = await page.locator('svg text').allTextContents();
    console.log('SVG labels found:', svgTexts.slice(0, 20));
    const targetLabel = svgTexts.find(t => t && t.trim().length > 0);
    if (!targetLabel) {
      // fallback: try original selector name
      console.warn('No SVG text labels found; falling back to text=Node 1');
      await page.waitForSelector('text=Node 1', { timeout: 15000 });
      const node = await page.locator('text=Node 1').first();
      const box = await node.boundingBox();
      if (!box) throw new Error('Node bounding box not found');
      targetLabel = null; // not used further
    }

    let nodeLocator;
    let circleHandle = null;
    if (targetLabel) {
      // wait for the label to be visible and use it to locate the associated circle element
      console.log('Targeting label:', targetLabel);
      const labelLocator = page.locator(`text=${targetLabel}`).first();
      await labelLocator.waitFor({ timeout: 15000 });
      const labelHandle = await labelLocator.elementHandle();
      if (labelHandle) {
        // find the nearest circle within the ancestor group, or nearby circle
        circleHandle = await labelHandle.evaluateHandle((el) => {
          function findCircleInGroup(node) {
            if (!node) return null;
            if (node.tagName && node.tagName.toLowerCase() === 'g') {
              const c = node.querySelector('circle');
              if (c) return c;
            }
            return node.parentElement ? findCircleInGroup(node.parentElement) : null;
          }
          const g = el.closest ? el.closest('g') : null;
          if (g) {
            const c = g.querySelector('circle');
            if (c) return c;
          }
          // fallback: search for any circle under the same parent
          const parent = el.parentElement;
          if (parent) {
            const circ = parent.querySelector('circle');
            if (circ) return circ;
          }
          // give up
          return null;
        });
      }
    }
    if (!circleHandle) {
      const firstCircleHandle = await page.locator('circle').first().elementHandle();
      circleHandle = firstCircleHandle;
    }
    if (!circleHandle) throw new Error('No circle element found to drag');
    const box = await circleHandle.boundingBox();
    if (!box) throw new Error('Node bounding box not found');

    // helper to read SVG coordinates (cx/cy or translate on parent group)
    async function readSvgPosFromHandle(handle) {
      return await handle.evaluate((el) => {
        function parseTranslate(t) {
          const m = /translate\(([-0-9.]+),?\s*([-0-9.]+)\)/.exec(t);
          if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
          return null;
        }
        // Always capture bounding client rect center for pixels
        const r = el.getBoundingClientRect();
        const rect = { rectCx: r.left + r.width / 2, rectCy: r.top + r.height / 2 };

        // If circle element, read cx/cy (if present)
        if (el.tagName && el.tagName.toLowerCase() === 'circle') {
          const cx = el.getAttribute('cx');
          const cy = el.getAttribute('cy');
          if (cx != null && cy != null) return Object.assign({ cx, cy }, rect);
          // otherwise fallthrough to find transform on ancestor
        }
        // Walk up to find a transform on a group
        let curr = el;
        while (curr && curr.tagName && curr.tagName.toLowerCase() !== 'svg') {
          const t = curr.getAttribute && curr.getAttribute('transform');
          if (t) {
            const p = parseTranslate(t);
            if (p) return Object.assign({ tx: p.x, ty: p.y }, rect);
          }
          curr = curr.parentElement;
        }
        // fallback: return rect
        return rect;
      });
    }

    const beforePos = await readSvgPosFromHandle(circleHandle);
    console.log('Position before drag:', beforePos);

    // Dispatch pointer events on the circle element (more reliable for some SVG-based drag handlers)
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const endX = startX + 120;
    const endY = startY + 60;
    try {
      await circleHandle.evaluate(async (el, cfg) => {
        const { startX, startY, endX, endY, steps } = cfg;
        function dispatchOn(target, type, x, y) {
          const ev = new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            pointerId: 1,
            pressure: 0.5,
            buttons: type === 'pointerup' ? 0 : 1,
            button: 0,
          });
          return target.dispatchEvent(ev);
        }

        // Start: hover+move+down
        dispatchOn(el, 'pointerover', startX, startY);
        dispatchOn(el, 'pointerenter', startX, startY);
        dispatchOn(el, 'pointermove', startX, startY);
        dispatchOn(el, 'pointerdown', startX, startY);
        try { if (el.setPointerCapture) el.setPointerCapture(1); } catch (e) {}

        // Move in steps
        for (let i = 1; i <= steps; i++) {
          const x = startX + ((endX - startX) * i) / steps;
          const y = startY + ((endY - startY) * i) / steps;
          dispatchOn(el, 'pointermove', x, y);
          // small delay to allow handlers to process
          // note: this is synchronous in evaluate; approximate with a busy wait
          const t0 = Date.now();
          while (Date.now() - t0 < 8) {}
        }

        // Release
        dispatchOn(el, 'pointerup', endX, endY);
        try { if (el.releasePointerCapture) el.releasePointerCapture(1); } catch (e) {}
      }, { startX, startY, endX, endY, steps: 10 });
    } catch (e) {
      console.warn('pointer-event dispatch failed, falling back to page.mouse:', e && e.message);
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
    }

    // give layout a moment to update
    await page.waitForTimeout(300);

    const afterPos = await readSvgPosFromHandle(circleHandle);
    console.log('Position after drag:', afterPos);

    // Assert numeric delta to fail CI if drag didn't move enough
    function numericValue(pos, keys) {
      for (const k of keys) {
        if (pos && pos[k] != null) {
          const v = Number(pos[k]);
          if (!Number.isNaN(v)) return v;
        }
      }
      return null;
    }
    const beforeX = numericValue(beforePos, ['rectCx', 'tx', 'cx']);
    const beforeY = numericValue(beforePos, ['rectCy', 'ty', 'cy']);
    const afterX = numericValue(afterPos, ['rectCx', 'tx', 'cx']);
    const afterY = numericValue(afterPos, ['rectCy', 'ty', 'cy']);
    if (beforeX != null && beforeY != null && afterX != null && afterY != null) {
      const dx = afterX - beforeX;
      const dy = afterY - beforeY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const MIN_DRAG_PIXELS = process.env.PLAYWRIGHT_MIN_DRAG_PIXELS ? Number(process.env.PLAYWRIGHT_MIN_DRAG_PIXELS) : 20;
      console.log('Drag delta (px):', { dx, dy, dist, threshold: MIN_DRAG_PIXELS });
      if (dist < MIN_DRAG_PIXELS) {
        console.error(`Drag movement below threshold (${dist.toFixed(2)}px < ${MIN_DRAG_PIXELS}px). Failing run.`);
        process.exitCode = 3;
      }
    } else {
      console.warn('Could not determine numeric before/after coordinates for assertion; skipping CI delta check.');
    }
    // save screenshot and trace
    try {
      await page.screenshot({ path: 'playwright/screenshot.png', fullPage: true });
      await context.tracing.stop({ path: 'playwright/trace.zip' });
      console.log('Saved screenshot to playwright/screenshot.png and trace to playwright/trace.zip');
    } catch (e) {
      console.warn('Failed to save artifacts:', e.message);
    }
  } catch (err) {
      // Attempt to capture a screenshot/trace for debugging
      try {
        await page.screenshot({ path: 'playwright/error-screenshot.png', fullPage: true });
      } catch (e) {
        // ignore
      }
      try {
        await context.tracing.stop({ path: 'playwright/error-trace.zip' });
      } catch (e) {
        // ignore
      }
      console.error('Error during run:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
