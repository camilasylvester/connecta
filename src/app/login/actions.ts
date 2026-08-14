"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { normalizeInstagramHandle } from "@/lib/instagram";

export type LoginAccountHint = {
  accountStatus: "pending" | "rejected";
};

export type LoginHandleLookup = {
  email: string;
};

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 8;
const MIN_RESPONSE_MS = 350;

/** Best-effort rate limit (per server instance). Slows casual email probing. */
const hitsByEmail = new Map<string, number[]>();

function allowLookup(email: string): boolean {
  const now = Date.now();
  const prev = (hitsByEmail.get(email) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (prev.length >= RATE_MAX) {
    hitsByEmail.set(email, prev);
    return false;
  }
  prev.push(now);
  hitsByEmail.set(email, prev);
  return true;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Post-login-failure helper: if this email has a Connecta profile that is
 * still pending or was rejected, return that status so the UI can explain
 * why sign-in failed. Never reveals "approved" or "no account" distinctly
 * (both look like null to callers).
 */
export async function getLoginAccountHint(
  rawEmail: string
): Promise<LoginAccountHint | null> {
  const started = Date.now();
  const email = rawEmail.trim().toLowerCase();

  const finish = async (value: LoginAccountHint | null) => {
    const elapsed = Date.now() - started;
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed);
    return value;
  };

  if (!email || !email.includes("@") || email.length > 254) {
    return finish(null);
  }
  if (!allowLookup(email)) {
    return finish(null);
  }

  try {
    const db = getDb();
    const rows = await db
      .select({ accountStatus: profiles.accountStatus })
      .from(profiles)
      .where(sql`lower(${profiles.email}) = ${email}`)
      .limit(1);

    const status = rows[0]?.accountStatus;
    if (status === "pending" || status === "rejected") {
      return finish({ accountStatus: status });
    }
    // approved / missing → same opaque null (no account enumeration for OK users)
    return finish(null);
  } catch {
    return finish(null);
  }
}

/** Resolve a creator login identifier (Instagram handle) to account email. */
export async function getLoginEmailByHandle(
  rawHandle: string
): Promise<LoginHandleLookup | null> {
  const handle = normalizeInstagramHandle(rawHandle)?.slice(1).toLowerCase();
  if (!handle || handle.length > 64) return null;

  try {
    const db = getDb();
    const rows = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(
        sql`lower(replace(coalesce(${profiles.handle}, ''), '@', '')) = ${handle}`
      )
      .limit(1);

    const email = rows[0]?.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return null;
    return { email };
  } catch {
    return null;
  }
}
