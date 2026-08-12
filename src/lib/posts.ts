import type { PostPlatform } from "@/db/schema";

export function detectPostPlatform(url: string): PostPlatform | null {
  const u = url.trim();
  if (!u) return null;
  if (/youtube\.com|youtu\.be/i.test(u)) return "youtube";
  if (/tiktok\.com/i.test(u)) return "tiktok";
  if (/instagram\.com/i.test(u)) return "instagram";
  return null;
}

export function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i
  );
  return m ? m[1] : null;
}

export function youtubeThumbUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function platformLabel(p: PostPlatform): string {
  switch (p) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
  }
}

/** Resolve thumbnail: YouTube local, TikTok via oEmbed, IG needs manual. */
export async function resolvePostThumb(
  url: string,
  platform: PostPlatform,
  manualThumb?: string | null
): Promise<string | null> {
  const manual = manualThumb?.trim() || null;
  if (manual && /^https?:\/\//i.test(manual)) return manual;

  if (platform === "youtube") return youtubeThumbUrl(url);

  if (platform === "tiktok") {
    try {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { thumbnail_url?: string };
      return data.thumbnail_url || null;
    } catch {
      return null;
    }
  }

  return null;
}

export function tiktokProfileUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const h = handle.trim().replace(/^@/, "");
  if (!h) return null;
  return `https://www.tiktok.com/@${h}`;
}
