import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { applyTikTokUserToProfile } from "@/lib/tiktok-profile";
import {
  exchangeTikTokCode,
  fetchTikTokUserInfo,
  TIKTOK_OAUTH_STATE_COOKIE,
} from "@/lib/tiktok";

async function redirectMiPerfil(
  req: Request,
  status: "connected" | "error",
  reason?: string
) {
  const url = new URL("/mi-perfil", req.url);
  url.searchParams.set("tiktok", status);
  if (reason) url.searchParams.set("reason", reason);
  const res = NextResponse.redirect(url);
  const jar = await cookies();
  jar.delete(TIKTOK_OAUTH_STATE_COOKIE);
  return res;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    const login = new URL("/login", req.url);
    const next = `/api/tiktok/callback${new URL(req.url).search}`;
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) {
    return redirectMiPerfil(req, "error", error);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const cookieState = jar.get(TIKTOK_OAUTH_STATE_COOKIE)?.value ?? null;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectMiPerfil(req, "error", "invalid_state");
  }

  try {
    const tokens = await exchangeTikTokCode(code);
    const info = await fetchTikTokUserInfo(tokens.accessToken);

    const db = getDb();
    const rows = await db
      .select({
        id: profiles.id,
        role: profiles.role,
        creatorMeta: profiles.creatorMeta,
        platforms: profiles.platforms,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    const profile = rows[0];
    if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
      return redirectMiPerfil(req, "error", "forbidden");
    }

    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    await applyTikTokUserToProfile({
      profileId: userId,
      info,
      tokens: {
        openId: tokens.openId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        expiresAt,
      },
      creatorMeta: profile.creatorMeta,
      platforms: profile.platforms,
    });

    return redirectMiPerfil(req, "connected");
  } catch {
    return redirectMiPerfil(req, "error", "exchange_failed");
  }
}
