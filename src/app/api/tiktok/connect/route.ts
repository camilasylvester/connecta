import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import {
  getTikTokAuthUrl,
  isTikTokConfigured,
  TIKTOK_OAUTH_STATE_COOKIE,
} from "@/lib/tiktok";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", "/api/tiktok/connect");
    return NextResponse.redirect(login);
  }

  if (!isTikTokConfigured()) {
    return NextResponse.redirect(
      new URL("/mi-perfil?tiktok=error&reason=not_configured", req.url)
    );
  }

  const db = getDb();
  const rows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const role = rows[0]?.role;
  if (role !== "creator" && role !== "admin") {
    return NextResponse.redirect(
      new URL("/mi-perfil?tiktok=error&reason=forbidden", req.url)
    );
  }

  const state = randomBytes(24).toString("hex");
  let authUrl: string;
  try {
    authUrl = getTikTokAuthUrl(state);
  } catch {
    return NextResponse.redirect(
      new URL("/mi-perfil?tiktok=error&reason=not_configured", req.url)
    );
  }

  const jar = await cookies();
  jar.set(TIKTOK_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl);
}
