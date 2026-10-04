// In-memory job management and processing orchestration.
import fs from "node:fs/promises";
import path from "node:path";
import { settings } from "../config.js";
import { browserManager } from "./browser.js";
import { dismissOverlays } from "./overlays.js";
import { generatePdf, pdfFromImage } from "./pdf.js";
import { captureFullPageScreenshot, captureScreenshotParts } from "./screenshot.js";
import { domainFromUrl, sanitizeFilenameComponent } from "../utils/files.js";
import { newId } from "../utils/security.js";

class Semaphore {
  constructor(max) {
    this._max = max;
    this._current = 0;
    this._queue = [];
  }

  async acquire() {
    if (this._current < this._max) {
      this._current += 1;
      return;
    }
    await new Promise((resolve) => this._queue.push(resolve));
    this._current += 1;
  }

  release() {
    this._current -= 1;
    const next = this._queue.shift();
    if (next) next();
  }

  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

function createJobItem(id, url, domain, folderName) {
  return {
    id,
    url,
    status: "waiting",
    error: null,
    domain,
    folderName,
    pngPath: null,
    pdfPath: null,
    parts: [],
  };
}

function createJob(id, items, dir, maxHeightPx) {
  const now = Date.now();
  return {
    id,
    status: "pending",
    items,
    dir,
    zipPath: null,
    maxHeightPx,
    createdAt: now,
    lastAccessedAt: now,
    deleted: false,
    get total() {
      return this.items.length;
    },
    get completed() {
      return this.items.filter((i) => i.status === "completed").length;
    },
    get failed() {
      return this.items.filter((i) => i.status === "failed").length;
    },
    touch() {
      this.lastAccessedAt = Date.now();
    },
  };
}

class JobManager {
  constructor() {
    this._jobs = new Map();
    this._semaphore = new Semaphore(settings.maxConcurrentJobs);
  }

  async createJob(urls, maxHeightPx = null) {
    const jobId = newId();
    const jobDir = path.join(settings.baseTempDir, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    const usedFolders = new Set();
    const items = [];
    for (const url of urls) {
      const domain = domainFromUrl(url);
      let folder = sanitizeFilenameComponent(domain);
      const baseFolder = folder;
      let suffix = 2;
      while (usedFolders.has(folder)) {
        folder = `${baseFolder}-${suffix}`;
        suffix += 1;
      }
      usedFolders.add(folder);
      items.push(createJobItem(newId(), url, domain, folder));
    }

    const job = createJob(jobId, items, jobDir, maxHeightPx);
    this._jobs.set(jobId, job);

    this._runJob(job).catch((err) => console.error("Job run failed:", err));
    return job;
  }

  async getJob(jobId) {
    const job = this._jobs.get(jobId);
    if (job && !job.deleted) {
      job.touch();
    }
    return job || null;
  }

  async _runJob(job) {
    job.status = "processing";

    await Promise.all(
      job.items.map((item) =>
        this._semaphore.run(async () => {
          item.status = "processing";
          await this._captureItem(job, item);
        })
      )
    );

    job.status = job.items.some((i) => i.status === "completed") || job.items.length === 0 ? "completed" : "failed";
    job.touch();
  }

  async _captureItem(job, item) {
    const itemDir = path.join(job.dir, item.folderName);
    await fs.mkdir(itemDir, { recursive: true });
    const pngPath = path.join(itemDir, "screenshot.png");
    const pdfPath = path.join(itemDir, "screenshot.pdf");

    try {
      await browserManager.withPage(async (page) => {
        try {
          await page.goto(item.url, { waitUntil: "load", timeout: settings.browserTimeoutMs });
          try {
            await page.waitForLoadState("networkidle", {
              timeout: Math.min(5000, settings.browserTimeoutMs),
            });
          } catch {
            console.log(`Network idle not reached for ${item.url}; continuing.`);
          }
        } catch (exc) {
          if (exc.name === "TimeoutError") {
            throw new TimeoutCaptureError(
              `The page timed out after ${Math.floor(settings.browserTimeoutMs / 1000)} seconds.`
            );
          }
          throw exc;
        }

        await dismissOverlays(page);
        await captureFullPageScreenshot(page, pngPath, job.maxHeightPx);
        await generatePdf(page, pdfPath);

        const partsDir = path.join(itemDir, "parts");
        await fs.mkdir(partsDir, { recursive: true });
        const partPngPaths = await captureScreenshotParts(
          page,
          partsDir,
          settings.splitPartHeightPx,
          settings.maxSplitParts
        );
        for (let i = 0; i < partPngPaths.length; i++) {
          const partIndex = i + 1;
          const partPngPath = partPngPaths[i];
          const partPdfPath = path.join(partsDir, `part-${partIndex}.pdf`);
          await pdfFromImage(partPngPath, partPdfPath);
          item.parts.push({ index: partIndex, pngPath: partPngPath, pdfPath: partPdfPath });
        }
      });

      item.pngPath = pngPath;
      item.pdfPath = pdfPath;
      item.status = "completed";
    } catch (exc) {
      item.status = "failed";
      if (exc instanceof TimeoutCaptureError) {
        item.error = exc.message;
        console.warn(`Timeout capturing ${item.url}: ${exc.message}`);
      } else if (isNavigationError(exc)) {
        item.error = "Unable to load website. It may be unreachable or blocking automated access.";
        console.warn(`Navigation error capturing ${item.url}:`, exc.message);
      } else {
        item.error = "An unexpected error occurred while capturing this website.";
        console.error(`Unexpected error capturing ${item.url}:`, exc);
      }
    } finally {
      job.touch();
    }
  }

  async deleteJob(jobId) {
    const job = this._jobs.get(jobId);
    this._jobs.delete(jobId);
    if (job) {
      job.deleted = true;
      await removeDir(job.dir);
    }
  }

  async sweepExpired() {
    const cutoff = Date.now() - settings.tempFileRetentionMinutes * 60 * 1000;
    const expired = [...this._jobs.values()].filter((j) => j.lastAccessedAt < cutoff);
    for (const job of expired) {
      this._jobs.delete(job.id);
    }
    for (const job of expired) {
      job.deleted = true;
      await removeDir(job.dir);
      console.log(`Swept expired job ${job.id}`);
    }
  }

  allJobs() {
    return [...this._jobs.values()];
  }
}

class TimeoutCaptureError extends Error {}

function isNavigationError(exc) {
  return Boolean(
    exc &&
      (exc.name === "TimeoutError" ||
        /net::|ERR_NAME_NOT_RESOLVED|navigation|frame was detached/i.test(exc.message || ""))
  );
}

async function removeDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (exc) {
    console.error(`Failed to remove job directory ${dirPath}:`, exc);
  }
}

export const jobManager = new JobManager();
