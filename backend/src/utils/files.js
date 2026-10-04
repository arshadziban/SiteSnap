// Filesystem helpers: filename sanitization and path-traversal protection.
import path from "node:path";

const UNSAFE_CHARS = /[^a-zA-Z0-9.\-_]/g;

export function domainFromUrl(url) {
  try {
    return (new URL(url).hostname || "site").toLowerCase();
  } catch {
    return "site";
  }
}

export function sanitizeFilenameComponent(value) {
  let cleaned = value.trim().replace(UNSAFE_CHARS, "-");
  cleaned = cleaned.replace(/^[.\-_]+|[.\-_]+$/g, "") || "site";
  return cleaned.slice(0, 100);
}

export function safeJoin(base, ...parts) {
  const baseResolved = path.resolve(base);
  const candidate = path.resolve(baseResolved, ...parts);
  if (candidate !== baseResolved && !candidate.startsWith(baseResolved + path.sep)) {
    throw new Error("Path traversal detected.");
  }
  return candidate;
}
