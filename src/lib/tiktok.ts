const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";

export const TIKTOK_SCOPES =
  "user.info.basic,user.info.profile,user.info.stats";

export const TIKTOK_OAUTH_STATE_COOKIE = "tiktok_oauth_state";

export type TikTokTokens = {
  openId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  scope: string;
};

export type TikTokUserInfo = {
  openId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
};

type TikTokEnv = {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
};

export function isTikTokConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_CLIENT_KEY?.trim() &&
      process.env.TIKTOK_CLIENT_SECRET?.trim() &&
      process.env.TIKTOK_REDIRECT_URI?.trim()
  );
}

function getTikTokEnv(): TikTokEnv {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
  const redirectUri = process.env.TIKTOK_REDIRECT_URI?.trim();
  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error("TikTok OAuth no está configurado (faltan variables de entorno)");
  }
  return { clientKey, clientSecret, redirectUri };
}

export function getTikTokAuthUrl(state: string): string {
  const { clientKey, redirectUri } = getTikTokEnv();
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

async function postForm(
  url: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.error === "string") {
    const desc =
      (typeof json.error_description === "string" && json.error_description) ||
      (typeof json.error === "string" && json.error) ||
      `HTTP ${res.status}`;
    throw new Error(`TikTok token error: ${desc}`);
  }
  return json;
}

function parseTokens(json: Record<string, unknown>): TikTokTokens {
  const accessToken = String(json.access_token || "");
  const refreshToken = String(json.refresh_token || "");
  const openId = String(json.open_id || "");
  if (!accessToken || !openId) {
    throw new Error("TikTok no devolvió access_token / open_id");
  }
  return {
    openId,
    accessToken,
    refreshToken,
    expiresIn: Number(json.expires_in) || 86400,
    refreshExpiresIn: Number(json.refresh_expires_in) || 0,
    scope: String(json.scope || ""),
  };
}

export async function exchangeTikTokCode(code: string): Promise<TikTokTokens> {
  const { clientKey, clientSecret, redirectUri } = getTikTokEnv();
  const json = await postForm(TIKTOK_TOKEN_URL, {
    client_key: clientKey,
    client_secret: clientSecret,
    code: decodeURIComponent(code),
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  return parseTokens(json);
}

export async function refreshTikTokToken(
  refreshToken: string
): Promise<TikTokTokens> {
  const { clientKey, clientSecret } = getTikTokEnv();
  const json = await postForm(TIKTOK_TOKEN_URL, {
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return parseTokens(json);
}

export async function revokeTikTokToken(accessToken: string): Promise<void> {
  const { clientKey, clientSecret } = getTikTokEnv();
  try {
    await postForm(TIKTOK_REVOKE_URL, {
      client_key: clientKey,
      client_secret: clientSecret,
      token: accessToken,
    });
  } catch {
    // Best-effort: still clear local tokens even if revoke fails
  }
}

export async function fetchTikTokUserInfo(
  accessToken: string
): Promise<TikTokUserInfo> {
  const fields = [
    "open_id",
    "avatar_url",
    "display_name",
    "username",
    "follower_count",
  ].join(",");
  const url = `${TIKTOK_USER_INFO_URL}?fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: { user?: Record<string, unknown> };
    error?: { code?: string; message?: string };
  };
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    throw new Error(
      json.error?.message || `TikTok user.info falló (HTTP ${res.status})`
    );
  }
  const user = json.data?.user || {};
  const usernameRaw =
    typeof user.username === "string" ? user.username.trim() : "";
  const follower =
    typeof user.follower_count === "number"
      ? user.follower_count
      : Number(user.follower_count);
  return {
    openId: typeof user.open_id === "string" ? user.open_id : null,
    username: usernameRaw
      ? usernameRaw.startsWith("@")
        ? usernameRaw
        : `@${usernameRaw}`
      : null,
    displayName:
      typeof user.display_name === "string" ? user.display_name : null,
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    followerCount: Number.isFinite(follower) ? follower : null,
  };
}

export function normalizeTikTokHandle(raw: string | null | undefined): string | null {
  const t = (raw || "").trim().replace(/^@+/, "");
  if (!t) return null;
  return `@${t}`;
}
