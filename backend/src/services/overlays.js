// Best-effort removal of cookie banners, newsletter popups, and similar overlays.
//
// Heuristic only: there is no reliable way to detect every site's popup markup, so
// this targets common patterns (high z-index fixed/sticky overlays, known consent
// banner libraries, and body scroll locks) without touching normal page content.

// Accessibility "skip to content/footer" links are visually hidden until focused. If
// one is revealed (or focused) at capture time it shows up as a stray dashed box above
// the header and pushes the layout down, so hide them and clear any focus ring.
function hideSkipLinksInPage() {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  const skipText = /skip|jump to|go to (main|content|footer)|main content|to footer|ফুটার|মূল (কন্টেন্ট|বিষয়)|নিরাপদ লেনদেন/i;
  const candidates = document.querySelectorAll(
    '[class*="skip" i], [id*="skip" i], [class*="landmark" i], [id*="landmark" i], [class*="jump-to" i], [class*="accessib" i], a[href^="#"]'
  );
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    const text = (el.innerText || el.textContent || '').trim();
    const named = /skip|jump|accessib|landmark/i.test(`${el.className} ${el.id}`);
    // Plain "#anchor" links only count when they sit in the very top strip of the page.
    const inTopStrip = rect.top + window.scrollY < 120 && rect.height < 120;
    // Elements explicitly named skip/landmark (a whole link list) are hidden at any size.
    if (named && /skip|landmark/i.test(`${el.className} ${el.id}`)) {
      el.style.setProperty('display', 'none', 'important');
      continue;
    }
    if (!inTopStrip || (!named && !skipText.test(text))) continue;
    if (el.closest('nav') && !named) continue;
    const container =
      el.parentElement && el.parentElement !== document.body && el.parentElement.children.length <= 4 &&
      /skip|jump|accessib|landmark/i.test(`${el.parentElement.className} ${el.parentElement.id}`)
        ? el.parentElement
        : el;
    container.style.setProperty('display', 'none', 'important');
  }
}

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
    // Third-party live-chat widgets (usually injected as fixed iframes/containers).
    '#intercom-container', '.intercom-lightweight-app', 'iframe[name="intercom-notification-channel"]',
    '#tidio-chat', '#tidio-chat-iframe', '#launcher', 'iframe#launcher', 'iframe[title*="chat" i]',
    '#hubspot-messages-iframe-container', '#drift-widget-container', '#drift-frame-chat',
    '#crisp-chatbox', '.crisp-client', '#livechat-compact-container', '#chat-widget-container',
    '#fc_frame', '#freshworks-container', '.zsiq_floatmain', '#zsiq_float', '#tawkchat-container',
    'iframe[title*="tawk" i]', '.fb_dialog', '.fb-customerchat', '#fb-root iframe',
    '[id*="chatbot" i]', '[class*="chatbot" i]', '[id*="chat-widget" i]', '[class*="chat-widget" i]',
    '[id*="livechat" i]', '[class*="livechat" i]', '[id*="webchat" i]', '[class*="webchat" i]',
  ];

  for (const selector of consentSelectors) {
    // Hide rather than remove: some widgets (e.g. Reve Chat) reload the host page
    // when their iframe is detached, which would undo all of this cleanup.
    document.querySelectorAll(selector).forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
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
      el.style.setProperty('display', 'none', 'important');
      removed += 1;
      continue;
    }

    // Auto-opened chat panels: fixed to a bottom corner, panel-sized, with a message
    // input or an embedded iframe (e.g. support bots that greet on landing).
    if (position === 'fixed' && rect.width >= 200 && rect.width <= 520 && rect.height >= 150) {
      const nearBottom = window.innerHeight - rect.bottom <= 80;
      const nearSide = rect.left <= 80 || window.innerWidth - rect.right <= 80;
      const hasChatUi = !!el.querySelector(
        'iframe, textarea, input[placeholder*="message" i], input[placeholder*="type" i]'
      );
      if (nearBottom && nearSide && hasChatUi) {
        el.style.setProperty('display', 'none', 'important');
        removed += 1;
        continue;
      }
    }

    // Small floating promo/chat widgets (e.g. "Get Free Consultancy" cards): fixed,
    // card-sized, and either carrying a close button or CTA-style text.
    if (position === 'fixed' && rect.width > 0 && rect.width <= 480 && rect.height <= 220) {
      const text = (el.innerText || '').trim().toLowerCase();
      const hasClose = !!el.querySelector(
        '[aria-label*="close" i], [class*="close" i], button[title*="close" i]'
      );
      const looksLikeCta =
        /free (consult|quote|trial|demo|audit)|book (a )?(call|demo)|chat with|talk to|get started|subscribe|we.re hiring/.test(text);
      const isNav = !!el.closest('header, nav') || el.matches('header, nav');
      if (!isNav && text.length < 120 && (looksLikeCta || (hasClose && text.length > 0))) {
        el.style.setProperty('display', 'none', 'important');
        removed += 1;
      }
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
const CHAT_CLOSE_SELECTORS = [
  '[aria-label*="minimi" i]', '[aria-label*="close" i]', '[title*="minimi" i]',
  '[title*="close" i]', 'button[class*="minimi" i]', '[class*="chat" i] [class*="close" i]',
];

// Chat panels often live in iframes where in-page removal can't reach. Try clicking
// their own close/minimize control first so the widget collapses cleanly.
async function closeChatPanels(page) {
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    for (const selector of CHAT_CLOSE_SELECTORS) {
      try {
        const target = frame.locator(selector).first();
        if (await target.isVisible({ timeout: 200 })) {
          await target.click({ timeout: 500 });
          break;
        }
      } catch {
        // try next selector
      }
    }
  }
}

export async function dismissOverlays(page) {
  try {
    await closeChatPanels(page);
  } catch {
    // best-effort only
  }
  try {
    await page.evaluate(hideSkipLinksInPage);
  } catch {
    // best-effort only
  }
  try {
    await page.evaluate(dismissOverlaysInPage);
  } catch {
    // best-effort only
  }
}
