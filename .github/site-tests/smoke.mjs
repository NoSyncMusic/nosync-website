import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';

const base = 'http://127.0.0.1:4173';
const matrix = [
  { name: 'Chromium desktop', type: chromium, viewport: { width: 1280, height: 800 } },
  { name: 'Firefox desktop', type: firefox, viewport: { width: 1280, height: 800 } },
  { name: 'WebKit desktop', type: webkit, viewport: { width: 1280, height: 800 } },
  { name: 'Chromium touch 360', type: chromium, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
  { name: 'WebKit iPhone portrait', type: webkit, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: 'WebKit iPhone compact', type: webkit, viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true },
  { name: 'WebKit iPhone landscape', type: webkit, viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }
];

function closeEnough(a, b, tolerance = 3) {
  return Math.abs(a - b) <= tolerance;
}

async function assertNoHorizontalOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  assert.ok(sizes.scrollWidth <= sizes.clientWidth + 1,
    `${label}: horizontal overflow ${sizes.scrollWidth}px > ${sizes.clientWidth}px`);
}

async function openAndCheckModal(page, trigger, label) {
  await page.locator(trigger).first().scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await page.locator(trigger).first().click();
  const modal = page.locator('.stream-modal.is-open');
  await modal.waitFor({ state: 'visible' });
  const geometry = await page.evaluate(() => {
    const panel = document.querySelector('.stream-modal-panel');
    const rect = panel.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const height = viewport?.height ?? window.innerHeight;
    return {
      panelTop: rect.top,
      panelBottom: rect.bottom,
      viewportTop: top,
      viewportBottom: top + height,
      bodyPosition: getComputedStyle(document.body).position,
      modalOpen: document.body.classList.contains('stream-modal-open')
    };
  });
  assert.ok(geometry.panelTop >= geometry.viewportTop - 3,
    `${label}: modal starts outside visual viewport: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.panelBottom <= geometry.viewportBottom + 3,
    `${label}: modal ends outside visual viewport: ${JSON.stringify(geometry)}`);
  assert.equal(geometry.bodyPosition, 'fixed', `${label}: background page is not scroll-locked`);
  assert.equal(geometry.modalOpen, true, `${label}: modal state class missing`);

  await page.keyboard.press('Escape');
  await page.locator('#stream-modal').waitFor({ state: 'hidden' });
  const after = await page.evaluate(() => window.scrollY);
  assert.ok(closeEnough(before, after),
    `${label}: scroll position changed from ${before} to ${after} after closing modal`);
}

const failures = [];

for (const config of matrix) {
  const browser = await config.type.launch();
  const context = await browser.newContext({
    viewport: config.viewport,
    isMobile: Boolean(config.isMobile),
    hasTouch: Boolean(config.hasTouch),
    deviceScaleFactor: config.isMobile ? 2 : 1
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#featured .stream-here-button').waitFor();
    await assertNoHorizontalOverflow(page, `${config.name} homepage`);
    await openAndCheckModal(page, '#featured .stream-here-button', `${config.name} homepage`);

    await page.goto(`${base}/releases/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#all-releases .stream-here-button').first().waitFor();
    await assertNoHorizontalOverflow(page, `${config.name} releases`);
    await openAndCheckModal(page, '#all-releases .stream-here-button', `${config.name} releases`);

    await page.goto(`${base}/presave/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#presave-status').waitFor();
    await assertNoHorizontalOverflow(page, `${config.name} presave`);

    assert.deepEqual(pageErrors, [], `${config.name}: page errors: ${pageErrors.join(' | ')}`);
    console.log(`PASS: ${config.name}`);
  } catch (error) {
    failures.push(`${config.name}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL: ${config.name}`, error);
  } finally {
    await context.close();
    await browser.close();
  }
}

if (failures.length) {
  throw new Error(`Browser smoke failures:\n${failures.join('\n')}`);
}
