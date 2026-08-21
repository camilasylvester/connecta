const CANONICAL_SITE_URL = "https://www.connectainf.com";

/**
 * Public base URL for shareable links (invite URLs, emails, etc.).
 * Never returns *.vercel.app — that breaks Clerk signup and confuses users.
 */
export function getPublicSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");

  if (raw && !isNonPublicHost(raw)) {
    return raw;
  }

  // Production / preview on Vercel: always the real domain for shared links
  if (
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  ) {
    return CANONICAL_SITE_URL;
  }

  return raw || "http://localhost:3000";
}

function isNonPublicHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith(".vercel.app") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
}

export function absolutePublicUrl(path: string): string {
  const base = getPublicSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
