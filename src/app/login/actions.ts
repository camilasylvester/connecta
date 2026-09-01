"use server";

import { headers } from "next/headers";
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
const RATE_MAX_HANDLE_LOOKUPS = 8;
const MIN_RESPONSE_MS = 350;

/** Best-effort rate limit (per server instance). Slows casual email probing. */
const hitsByKey = new Map<string, number[]>();

function allowRateLimit(key: string, max = RATE_MAX): boolean {
  const now = Date.now();
  const prev = (hitsByKey.get(key) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (prev.length >= max) {
    hitsByKey.set(key, prev);
    return false;
  }
  prev.push(now);
  hitsByKey.set(key, prev);
  return true;
}

function allowLookup(email: string): boolean {
  return allowRateLimit(`email:${email}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

async function withMinDelay<T>(
  started: number,
  value: T
): Promise<T> {
  const elapsed = Date.now() - started;
  if (elapsed < MIN_RESPONSE_MS) {
    await sleep(MIN_RESPONSE_MS - elapsed);
  }
  return value;
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

  const finish = (value: LoginAccountHint | null) =>
    withMinDelay(started, value);

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
  const started = Date.now();
  const finish = (value: LoginHandleLookup | null) =>
    withMinDelay(started, value);

  const handle = normalizeInstagramHandle(rawHandle)?.slice(1).toLowerCase();
  if (!handle || handle.length > 64) {
    return finish(null);
  }

  const ip = await clientIp();
  if (
    !allowRateLimit(`handle-ip:${ip}`, RATE_MAX_HANDLE_LOOKUPS) ||
    !allowRateLimit(`handle:${handle}`, RATE_MAX_HANDLE_LOOKUPS)
  ) {
    return finish(null);
  }

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
    if (!email || !email.includes("@")) return finish(null);
    return finish({ email });
  } catch {
    return finish(null);
  }
}
