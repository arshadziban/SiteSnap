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

  /** Relaunches Chromium if the shared instance died or disconnected. */
  async _ensureBrowser(forceRestart = false) {
    if (!this._browser) {
      throw new Error("Browser has not been started.");
    }
    if (forceRestart || !this._browser.isConnected()) {
      console.warn("Chromium is unhealthy; relaunching.");
      await this._browser.close().catch(() => {});
      await this.start();
    }
  }

  async _openPage(forceRestart) {
    await this._ensureBrowser(forceRestart);
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
      return { context, page };
    } catch (exc) {
      await context.close().catch(() => {});
      throw exc;
    }
  }

  /** Runs `fn(page)` inside a fresh, isolated browser context+page, cleaning up after. */
  async withPage(fn) {
    let opened;
    try {
      opened = await this._openPage(false);
    } catch {
      // A crashed shared browser fails newPage; relaunch once and retry.
      opened = await this._openPage(true);
    }
    const { context, page } = opened;

    try {
      try {
        return await fn(page);
      } finally {
        await page.close().catch(() => {});
      }
    } finally {
      await context.close().catch(() => {});
    }
  }
}

export const browserManager = new BrowserManager();
