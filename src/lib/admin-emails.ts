/**
 * Admin allowlist — emails come ONLY from ADMIN_EMAILS (comma-separated).
 * Set in Vercel / .env.local. Never commit real admin emails in source.
 */
export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (fromEnv.length === 0 && process.env.NODE_ENV === "production") {
    console.error(
      "[admin-emails] ADMIN_EMAILS is empty in production — no admins will be promoted"
    );
  }

  return [...new Set(fromEnv)];
}

function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split("@");
  if (!domain) return trimmed;
  // Gmail ignores dots and +tags
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const base = local.split("+")[0].replace(/\./g, "");
    return `${base}@gmail.com`;
  }
  return trimmed;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return getAdminEmails().some((allowed) => normalizeEmail(allowed) === normalized);
}

export function isAdminEmailList(emails: Array<string | null | undefined>): boolean {
  return emails.some((e) => isAdminEmail(e));
}
