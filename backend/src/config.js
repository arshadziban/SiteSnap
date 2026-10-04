// Application configuration loaded from environment variables.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function envStr(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function envInt(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const tempDir = envStr("TEMP_DIR", "");

export const settings = {
  appEnv: envStr("APP_ENV", "development"),

  host: envStr("HOST", "0.0.0.0"),
  port: envInt("PORT", 8000),

  maxUrlsPerJob: envInt("MAX_URLS_PER_JOB", 20),
  maxConcurrentJobs: envInt("MAX_CONCURRENT_JOBS", 3),

  browserTimeoutMs: envInt("BROWSER_TIMEOUT_MS", 30000),

  tempFileRetentionMinutes: envInt("TEMP_FILE_RETENTION_MINUTES", 30),

  corsOrigins: envStr("CORS_ORIGINS", "http://localhost:5173"),

  maxScreenshotHeightPx: envInt("MAX_SCREENSHOT_HEIGHT_PX", 20000),

  splitPartHeightPx: envInt("SPLIT_PART_HEIGHT_PX", 1000),
  maxSplitParts: envInt("MAX_SPLIT_PARTS", 20),

  get baseTempDir() {
    const base = tempDir ? path.resolve(tempDir) : path.join(os.tmpdir(), "sitesnap");
    fs.mkdirSync(base, { recursive: true });
    return base;
  },

  get corsOriginList() {
    return this.corsOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  },
};
