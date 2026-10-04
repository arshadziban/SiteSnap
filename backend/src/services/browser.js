// Playwright browser lifecycle management.
import { chromium } from "playwright";
import { settings } from "../config.js";

const VIEWPORT = { width: 1440, height: 900 };

class BrowserManager {
  constructor() {
    this._browser = null;
  }

  async start() {
    this._browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
    console.log("Chromium browser launched.");
  }

  async stop() {
    if (this._browser) {
      await this._browser.close();
      this._browser = null;
    }
    console.log("Chromium browser stopped.");
  }

  /** Runs `fn(page)` inside a fresh, isolated browser context+page, cleaning up after. */
  async withPage(fn) {
    if (!this._browser) {
      throw new Error("Browser has not been started.");
    }

    const context = await this._browser.newContext({
      viewport: VIEWPORT,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SiteSnap/1.0",
      ignoreHTTPSErrors: false,
    });
    context.setDefaultTimeout(settings.browserTimeoutMs);

    try {
      const page = await context.newPage();
      try {
        return await fn(page);
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
    }
  }
}

export const browserManager = new BrowserManager();
