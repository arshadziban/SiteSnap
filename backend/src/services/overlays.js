// Best-effort removal of cookie banners, newsletter popups, and similar overlays.
//
// Heuristic only: there is no reliable way to detect every site's popup markup, so
// this targets common patterns (high z-index fixed/sticky overlays, known consent
// banner libraries, and body scroll locks) without touching normal page content.

function dismissOverlaysInPage() {
  const consentSelectors = [
    '#onetrust-banner-sdk', '#onetrust-consent-sdk', '.ot-sdk-container',
    '#CybotCookiebotDialog', '.cookiebot',
    '#cookie-law-info-bar', '.cli-modal-backdrop',
    '#cookie-notice', '.cookie-notice',
    '[id*="cookie-banner" i]', '[class*="cookie-banner" i]',
    '[id*="cookie-consent" i]', '[class*="cookie-consent" i]',
    '[id*="consent-banner" i]', '[class*="consent-banner" i]',
    '[id*="newsletter-popup" i]', '[class*="newsletter-popup" i]',
    '[class*="modal-backdrop" i]', '[class*="overlay-backdrop" i]',
    '[role="dialog"]', '[aria-modal="true"]',
  ];

  for (const selector of consentSelectors) {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }

  const all = document.body ? document.body.querySelectorAll('*') : [];
  let removed = 0;
  const maxRemovals = 15;

  for (const el of all) {
    if (removed >= maxRemovals) break;
    const style = window.getComputedStyle(el);
    const position = style.position;
    const zIndex = parseInt(style.zIndex, 10) || 0;
    const rect = el.getBoundingClientRect();
    const coversViewport =
      rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.4;

    if ((position === 'fixed' || position === 'sticky') && zIndex >= 999 && coversViewport) {
      el.remove();
      removed += 1;
    }
  }

  if (document.body) {
    document.body.style.overflow = '';
    document.body.style.position = '';
  }
  document.documentElement.style.overflow = '';

  return removed;
}

/**
 * Remove common cookie/consent/newsletter popup overlays from the page.
 *
 * Runs after initial load. Failures are swallowed: this is a best-effort
 * cosmetic pass and must never fail the capture itself.
 */
export async function dismissOverlays(page) {
  try {
    await page.evaluate(dismissOverlaysInPage);
  } catch {
    // best-effort only
  }
}
