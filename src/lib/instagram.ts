/** Normalize Instagram handle to @username */
export function normalizeInstagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = raw.trim();
  if (!h) return null;
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  h = h.split(/[/?#]/)[0] || "";
  h = h.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  if (!h) return null;
  return `@${h}`;
}

/** Public profile URL for an Instagram handle */
export function instagramUrl(handle: string | null | undefined): string | null {
  const normalized = normalizeInstagramHandle(handle);
  if (!normalized) return null;
  return `https://instagram.com/${normalized.slice(1)}`;
}
