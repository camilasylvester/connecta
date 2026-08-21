import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import {
  normalizeTikTokHandle,
  type TikTokUserInfo,
} from "@/lib/tiktok";

type CreatorMeta = {
  ubicacion: string | null;
  genero: string | null;
  idiomas: string[];
  categoriaSet: string[];
  redes: Record<string, number>;
} | null;

export async function applyTikTokUserToProfile(args: {
  profileId: string;
  info: TikTokUserInfo;
  tokens?: {
    openId: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  };
  creatorMeta: CreatorMeta;
  platforms: string[] | null;
}) {
  const handle = normalizeTikTokHandle(args.info.username);
  const prevMeta = args.creatorMeta;
  const redes = { ...(prevMeta?.redes || {}) };
  if (args.info.followerCount != null && args.info.followerCount >= 0) {
    redes.TikTok = args.info.followerCount;
  }
  const creatorMeta: NonNullable<CreatorMeta> = prevMeta
    ? { ...prevMeta, redes }
    : {
        ubicacion: null,
        genero: null,
        idiomas: [],
        categoriaSet: [],
        redes,
      };

  const platforms = Array.isArray(args.platforms) ? [...args.platforms] : [];
  if (!platforms.includes("TikTok")) {
    platforms.push("TikTok");
  }

  const patch: Record<string, unknown> = {
    creatorMeta,
    platforms,
    updatedAt: new Date(),
  };

  if (args.tokens) {
    patch.tiktokOpenId = args.tokens.openId;
    patch.tiktokAccessToken = args.tokens.accessToken;
    patch.tiktokRefreshToken = args.tokens.refreshToken;
    patch.tiktokTokenExpiresAt = args.tokens.expiresAt;
    patch.tiktokConnectedAt = new Date();
  }

  if (handle) {
    patch.tiktokHandle = handle;
  }
  if (args.info.followerCount != null && args.info.followerCount >= 0) {
    patch.tiktokFollowers = args.info.followerCount;
  }

  const db = getDb();
  await db.update(profiles).set(patch).where(eq(profiles.id, args.profileId));
}
