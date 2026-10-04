const SPLIT_PATTERN = /[\s,]+/;
const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

export function splitRawInput(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .trim()
    .split(SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function looksLikeUrl(value: string): boolean {
  const candidate = value.includes("://") ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    return ALLOWED_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    const key = url.trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

export function domainFromUrl(url: string): string {
  try {
    const candidate = url.includes("://") ? url : `https://${url}`;
    return new URL(candidate).hostname;
  } catch {
    return url;
  }
}
