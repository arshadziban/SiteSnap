// Best-effort "let the page finish animating" pass before capture.
//
// Many sites start count-up numbers ("10+", "500+ clients") and reveal-on-scroll
// animations only once the element enters the viewport, and the count takes a
// second or two. Some also reset the number when it leaves the viewport. Capturing
// right after load catches them at 0 or mid-count. This pass:
//   1. scrolls through the page with real mouse-wheel input (some sites ignore
//      programmatic scrollTo), waiting at each step for visible numbers to finish;
//   2. remembers the highest value each number reached;
//   3. applies declared end values (data-to-value etc.) for counters that never fired;
//   4. returns to the top and restores any number that reset on the way back.
// A total time budget (PAGE_SETTLE_MAX_MS) bounds the whole pass.

import { settings } from "../config.js";

const SCROLL_PAUSE_MS = 150;
const POLL_MS = 150;
const STABLE_POLLS = 2;
const PER_STEP_MAX_MS = 2200;
const MAX_SCROLL_STEPS = 80;

// Runs in the page. Tags numeric leaf elements and returns a string of the ones
// currently in the viewport (empty when none), updating the max-seen record.
function trackNumbersInPage() {
  const store = (window.__ssNumbers = window.__ssNumbers || new Map());
  const numRe = /^[\d.,]+\s*[+%kKmMbB]?\+?$/;
  const parse = (t) => Number(t.replace(/[^\d.]/g, ''));
  const visible = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const t = node.nodeValue.trim();
    if (!t || t.length > 20 || !numRe.test(t)) continue;
    const el = node.parentElement;
    if (!el) continue;
    const value = parse(t);
    const prev = store.get(node);
    if (!prev || value > prev.value) store.set(node, { value, text: node.nodeValue });
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight && r.width > 0) visible.push(t);
  }
  return visible.join('|');
}

async function waitForVisibleNumbers(page, maxMs) {
  const start = Date.now();
  let last = await page.evaluate(trackNumbersInPage);
  if (!last) return;
  let stable = 0;
  while (Date.now() - start < maxMs && stable < STABLE_POLLS) {
    await page.waitForTimeout(POLL_MS);
    const current = await page.evaluate(trackNumbersInPage);
    stable = current === last ? stable + 1 : 0;
    last = current;
  }
}

async function scrollThroughPage(page, deadline) {
  const viewport = page.viewportSize() || { width: 1280, height: 720 };
  const step = Math.max(Math.floor(viewport.height * 0.9), 300);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  for (let i = 0; i < MAX_SCROLL_STEPS && Date.now() < deadline; i++) {
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(SCROLL_PAUSE_MS);
    let after = await page.evaluate(() => window.scrollY);
    if (after === before) {
      // Wheel input ignored (e.g. custom scroller); fall back to scrollTo.
      await page.evaluate((y) => window.scrollTo(0, y), before + step);
      after = await page.evaluate(() => window.scrollY);
    }
    await waitForVisibleNumbers(page, Math.min(PER_STEP_MAX_MS, Math.max(0, deadline - Date.now())));
    if (after === before) break; // reached the bottom
  }
}

// Counters driven by a scroll trigger can stay at their start value even after
// scrolling. They often declare their end value in a data attribute, so apply it.
async function applyDeclaredEndValues(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-to-value], [data-target], [data-count-to], [data-countup]').forEach((el) => {
      if (el.children.length) return;
      const raw =
        el.getAttribute('data-to-value') ??
        el.getAttribute('data-target') ??
        el.getAttribute('data-count-to') ??
        el.getAttribute('data-countup');
      const target = Number(raw);
      if (!Number.isFinite(target)) return;
      const current = Number((el.textContent || '').replace(/[^\d.-]/g, ''));
      if (current === target) return;
      const decimals = (String(raw).split('.')[1] || '').length;
      el.textContent = target.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: el.getAttribute('data-delimiter') !== '',
      });
    });
  });
}

// Runs in the page: put back any number that dropped below the highest value seen.
function restoreResetNumbersInPage() {
  const store = window.__ssNumbers;
  if (!store) return;
  const parse = (t) => Number(t.replace(/[^\d.]/g, ''));
  for (const [node, rec] of store) {
    if (!node.isConnected) continue;
    const current = parse(node.nodeValue);
    if (Number.isFinite(current) && current < rec.value) node.nodeValue = rec.text;
  }
}

export async function waitForPageToSettle(page) {
  const deadline = Date.now() + settings.pageSettleMaxMs;
  try {
    await scrollThroughPage(page, deadline);
    await applyDeclaredEndValues(page);
    await page.evaluate(trackNumbersInPage); // record declared end values too
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    // Scrolling back can re-trigger counters near the top; let them finish, then
    // put back anything that still ended below its highest seen value.
    await waitForVisibleNumbers(page, PER_STEP_MAX_MS);
    await page.evaluate(restoreResetNumbersInPage);
  } catch {
    // best-effort only; never fail the capture
  }
}
