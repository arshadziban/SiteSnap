// Job creation, status polling, and file download endpoints.
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { settings } from "../config.js";
import { jobManager } from "../services/jobs.js";
import { createExportZipWithParts, createFirstPartsZip } from "../services/zip.js";
import { isValidUuid } from "../utils/security.js";
import { UrlValidationError, validateAndNormalize } from "../utils/urls.js";

export const jobsRouter = Router();

function partToResponse(jobId, item, part) {
  return {
    index: part.index,
    png_url: `/api/jobs/${jobId}/items/${item.id}/parts/${part.index}/png`,
    pdf_url: `/api/jobs/${jobId}/items/${item.id}/parts/${part.index}/pdf`,
  };
}

function itemToResponse(jobId, item) {
  let screenshotUrl = null;
  let pdfUrl = null;
  let parts = [];
  if (item.status === "completed") {
    screenshotUrl = `/api/jobs/${jobId}/items/${item.id}/png`;
    pdfUrl = `/api/jobs/${jobId}/items/${item.id}/pdf`;
    parts = item.parts.map((part) => partToResponse(jobId, item, part));
  }
  return {
    id: item.id,
    url: item.url,
    status: item.status,
    domain: item.domain || null,
    screenshot_url: screenshotUrl,
    pdf_url: pdfUrl,
    parts,
    error: item.error,
  };
}

function jobToResponse(job) {
  return {
    job_id: job.id,
    status: job.status,
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    items: job.items.map((item) => itemToResponse(job.id, item)),
  };
}

function findItem(job, itemId) {
  const item = job.items.find((i) => i.id === itemId);
  if (!item) {
    const err = new Error("Item not found.");
    err.status = 404;
    throw err;
  }
  return item;
}

function findPart(item, partIndex) {
  const part = item.parts.find((p) => p.index === partIndex);
  if (!part) {
    const err = new Error("Part not found.");
    err.status = 404;
    throw err;
  }
  return part;
}

jobsRouter.post("/api/jobs", async (req, res, next) => {
  try {
    const { urls, max_height_px: maxHeightPx } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ detail: "Please provide at least one URL." });
    }
    if (maxHeightPx !== undefined && maxHeightPx !== null) {
      if (typeof maxHeightPx !== "number" || maxHeightPx <= 0 || maxHeightPx > 20000) {
        return res.status(400).json({ detail: "max_height_px must be between 1 and 20000." });
      }
    }

    let normalized;
    try {
      normalized = await validateAndNormalize(urls, settings.maxUrlsPerJob);
    } catch (exc) {
      if (exc instanceof UrlValidationError) {
        return res.status(400).json({ detail: exc.message });
      }
      throw exc;
    }

    const job = await jobManager.createJob(normalized, maxHeightPx ?? null);
    res.json({ job_id: job.id });
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId", async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidUuid(jobId)) {
      return res.status(404).json({ detail: "Job not found. It may have expired." });
    }
    const job = await jobManager.getJob(jobId);
    if (!job) {
      return res.status(404).json({ detail: "Job not found. It may have expired." });
    }
    res.json(jobToResponse(job));
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/items/:itemId/png", async (req, res, next) => {
  try {
    const { jobId, itemId } = req.params;
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });
    const item = findItem(job, itemId);
    if (item.status !== "completed" || !item.pngPath || !fs.existsSync(item.pngPath)) {
      return res.status(404).json({ detail: "Screenshot not available." });
    }
    res.download(item.pngPath, `${item.folderName}-screenshot.png`);
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/items/:itemId/pdf", async (req, res, next) => {
  try {
    const { jobId, itemId } = req.params;
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });
    const item = findItem(job, itemId);
    if (item.status !== "completed" || !item.pdfPath || !fs.existsSync(item.pdfPath)) {
      return res.status(404).json({ detail: "PDF not available." });
    }
    res.download(item.pdfPath, `${item.folderName}-screenshot.pdf`);
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/items/:itemId/parts/:partIndex/png", async (req, res, next) => {
  try {
    const { jobId, itemId } = req.params;
    const partIndex = Number.parseInt(req.params.partIndex, 10);
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });
    const item = findItem(job, itemId);
    const part = findPart(item, partIndex);
    if (!fs.existsSync(part.pngPath)) {
      return res.status(404).json({ detail: "Part not available." });
    }
    res.download(part.pngPath, `${item.folderName}-part-${part.index}.png`);
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/items/:itemId/parts/:partIndex/pdf", async (req, res, next) => {
  try {
    const { jobId, itemId } = req.params;
    const partIndex = Number.parseInt(req.params.partIndex, 10);
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });
    const item = findItem(job, itemId);
    const part = findPart(item, partIndex);
    if (!fs.existsSync(part.pdfPath)) {
      return res.status(404).json({ detail: "Part not available." });
    }
    res.download(part.pdfPath, `${item.folderName}-part-${part.index}.pdf`);
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/download", async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });

    const completedItems = job.items.filter((i) => i.status === "completed" && i.pngPath && i.pdfPath);
    if (completedItems.length === 0) {
      return res.status(404).json({ detail: "No completed results available for this job." });
    }

    const zipPath = path.join(job.dir, "sitesnap-export.zip");
    const folderFiles = {};
    const folderParts = {};
    for (const item of completedItems) {
      folderFiles[item.folderName] = { png: item.pngPath, pdf: item.pdfPath };
      if (item.parts.length) {
        folderParts[item.folderName] = item.parts.map((part) => ({
          index: part.index,
          pngPath: part.pngPath,
          pdfPath: part.pdfPath,
        }));
      }
    }
    await createExportZipWithParts(zipPath, folderFiles, folderParts);
    job.zipPath = zipPath;

    res.download(zipPath, "sitesnap-export.zip");
  } catch (exc) {
    next(exc);
  }
});

jobsRouter.get("/api/jobs/:jobId/download-first-parts", async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidUuid(jobId)) {
      return res.status(404).json({ detail: "Job not found. It may have expired." });
    }
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ detail: "Job not found. It may have expired." });

    const entries = job.items
      .filter((i) => i.status === "completed")
      .map((i) => ({ folderName: i.folderName, pngPath: i.parts.find((p) => p.index === 1)?.pngPath }))
      .filter((e) => e.pngPath && fs.existsSync(e.pngPath));
    if (entries.length === 0) {
      return res.status(404).json({ detail: "No first-part screenshots available for this job." });
    }

    const zipPath = path.join(job.dir, "sitesnap-first-parts.zip");
    await createFirstPartsZip(zipPath, entries);
    res.download(zipPath, "sitesnap-first-parts.zip");
  } catch (exc) {
    next(exc);
  }
});

// Centralized handling for thrown { status, message } errors from findItem/findPart.
jobsRouter.use((err, req, res, next) => {
  if (err && err.status) {
    return res.status(err.status).json({ detail: err.message });
  }
  next(err);
});
