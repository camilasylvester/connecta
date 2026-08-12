import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CreatorFeed } from "@/components/CreatorFeed";
import { getDb } from "@/db";
import { creatorPosts, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import { instagramUrl } from "@/lib/instagram";
import { tiktokProfileUrl } from "@/lib/posts";
import { avatarColor, initialsFromName } from "@/app/dashboard/brand-helpers";
import "../../brand-dash.css";

export default async function CreatorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await ensureProfile();
  if (!me) redirect("/login");
  if (me.role !== "brand" && me.role !== "admin") {
    redirect("/eventos");
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  const u = rows[0];
  if (!u || (u.role !== "creator" && u.role !== "admin")) notFound();

  const posts = await db
    .select()
    .from(creatorPosts)
    .where(eq(creatorPosts.creatorId, id))
    .orderBy(desc(creatorPosts.createdAt));

  const handle = u.handle || u.displayName || "Creador";
  const ig = instagramUrl(u.handle);
  const tt = tiktokProfileUrl(u.tiktokHandle);
  const color = avatarColor(u.id);
  const initials = initialsFromName(u.displayName || handle);
  const themes = Array.isArray(u.contentThemes) ? u.contentThemes : [];
  const collabs = posts.filter((p) => p.brandLabel).length;

  return (
    <div className="brand-app" style={{ minHeight: "auto", background: "transparent" }}>
      <div className="topbar">
        <div>
          <Link href="/dashboard/creadores" className="back-link">
            ← Creadores
          </Link>
          <h1>Portfolio</h1>
          <div className="sub">Publicaciones y datos que el influencer compartió</div>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 800 }}>
        <div className="creator-portfolio">
          <div className="flex flex-wrap items-start gap-5">
            <div
              className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] text-2xl font-bold text-white"
              style={{ background: color }}
            >
              {u.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="portfolio-name">{u.handle || u.displayName}</h2>
              {u.displayName && u.handle ? (
                <p className="portfolio-sub">{u.displayName}</p>
              ) : null}
              <p className="portfolio-sub mt-2">
                {themes.slice(0, 3).join(" · ") || "Creador de contenido"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {u.province ? (
                  <span className="tag-pill">{u.province}</span>
                ) : null}
                {ig ? (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-link"
                  >
                    Instagram
                  </a>
                ) : null}
                {tt ? (
                  <a
                    href={tt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-link"
                  >
                    TikTok
                  </a>
                ) : null}
              </div>
              <div className="portfolio-stats">
                <div className="stat-mini">
                  <b>{posts.length}</b>Publicaciones
                </div>
                <div className="stat-mini">
                  <b>{(u.followers || 0).toLocaleString("es-AR")}</b>Seguidores IG
                </div>
                {u.tiktokHandle ? (
                  <div className="stat-mini">
                    <b>{(u.tiktokFollowers || 0).toLocaleString("es-AR")}</b>
                    Seguidores TikTok
                  </div>
                ) : null}
                <div className="stat-mini">
                  <b>{collabs}</b>Colaboraciones
                </div>
              </div>
            </div>
          </div>

          <div className="portfolio-feed">
            <h3>Feed de acciones</h3>
            <CreatorFeed posts={posts} creatorHandle={u.handle} />
          </div>
        </div>
      </div>
    </div>
  );
}
