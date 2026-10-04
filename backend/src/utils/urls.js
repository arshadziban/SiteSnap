// URL parsing, normalization, and SSRF-safe validation.
import dns from "node:dns/promises";
import net from "node:net";

const ALLOWED_SCHEMES = new Set(["http", "https"]);

// Hostnames that always resolve to the local machine or are otherwise unsafe.
const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

const SPLIT_PATTERN = /[\s,]+/;
const SCHEME_PATTERN = /^([a-zA-Z][a-zA-Z0-9+.\-]*):/;

export class UrlValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UrlValidationError";
  }
}

/** Split freeform pasted text into candidate URL strings (newline/comma/whitespace separated). */
export function splitRawInput(raw) {
  if (!raw) return [];
  return raw
    .trim()
    .split(SPLIT_PATTERN)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Normalize a URL string: trim whitespace, lowercase scheme/host, drop fragment. */
export function normalizeUrl(raw) {
  let candidate = raw.trim();
  if (!candidate) {
    throw new UrlValidationError("Empty URL.");
  }

  const schemeMatch = candidate.match(SCHEME_PATTERN);
  if (schemeMatch) {
    const declaredScheme = schemeMatch[1].toLowerCase();
    if (!ALLOWED_SCHEMES.has(declaredScheme)) {
      throw new UrlValidationError(
        `Unsupported protocol: ${declaredScheme}. Only http and https are allowed.`
      );
    }
    if (!candidate.includes("://")) {
      throw new UrlValidationError(`Invalid URL: ${raw}`);
    }
  } else {
    candidate = `https://${candidate}`;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new UrlValidationError(`Invalid URL: ${raw}`);
  }

  const scheme = parsed.protocol.replace(":", "").toLowerCase();
  if (!ALLOWED_SCHEMES.has(scheme)) {
    throw new UrlValidationError(`Unsupported protocol: ${scheme || "unknown"}. Only http and https are allowed.`);
  }
  if (!parsed.hostname) {
    throw new UrlValidationError(`Invalid URL: ${raw}`);
  }
  if (parsed.username) {
    throw new UrlValidationError("URLs with embedded credentials are not allowed.");
  }

  let netloc = parsed.hostname.toLowerCase();
  if (parsed.port) {
    netloc = `${netloc}:${parsed.port}`;
  }

  const pathPart = parsed.pathname || "/";
  return `${scheme}://${netloc}${pathPart}${parsed.search || ""}`;
}

export function dedupeUrls(urls) {
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}

function isPrivateIp(ipStr) {
  const kind = net.isIP(ipStr);
  if (kind === 0) return false;

  if (kind === 4) {
    const octets = ipStr.split(".").map(Number);
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }

  // IPv6
  const lower = ipStr.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("ff")) return true; // multicast
  return false;
}

/**
 * Resolve the URL's host and reject it if it points to a private/internal network.
 *
 * This is a best-effort SSRF mitigation performed at validation time. Because DNS
 * can change between validation and the actual browser navigation (DNS rebinding),
 * this check should ideally be combined with network-level restrictions.
 */
export async function assertPublicHost(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new UrlValidationError(`Invalid URL: ${url}`);
  }
  if (!hostname) {
    throw new UrlValidationError(`Invalid URL: ${url}`);
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UrlValidationError(`Requests to '${hostname}' are not allowed.`);
  }

  if (isPrivateIp(hostname)) {
    throw new UrlValidationError("Requests to private/internal IP addresses are not allowed.");
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UrlValidationError(`Could not resolve host: ${hostname}`);
  }

  for (const { address } of records) {
    if (isPrivateIp(address)) {
      throw new UrlValidationError(`'${hostname}' resolves to a private/internal address and is not allowed.`);
    }
  }
}

/** Normalize, dedupe, and validate a list of raw URL strings. */
export async function validateAndNormalize(rawUrls, maxUrls) {
  const flattened = [];
  for (const raw of rawUrls) {
    flattened.push(...splitRawInput(raw));
  }

  const normalized = flattened.map((u) => normalizeUrl(u));
  const deduped = dedupeUrls(normalized);

  if (deduped.length === 0) {
    throw new UrlValidationError("Please provide at least one URL.");
  }

  if (deduped.length > maxUrls) {
    throw new UrlValidationError(`You can process up to ${maxUrls} websites at a time.`);
  }

  for (const url of deduped) {
    await assertPublicHost(url);
  }

  return deduped;
}
