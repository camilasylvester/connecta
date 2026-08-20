import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { CreatorFeed } from "@/components/CreatorFeed";
import { getDb } from "@/db";
import { applications, creatorPosts, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import { hydrateCreatorMeta } from "@/lib/creator-search";
import { instagramUrl } from "@/lib/instagram";
import { tiktokProfileUrl } from "@/lib/posts";
import { avatarColor, initialsFromName } from "@/app/dashboard/brand-helpers";

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

  const [collabRow] = await db
    .select({ total: count() })
    .from(applications)
    .where(
      and(
        eq(applications.creatorId, id),
        eq(applications.status, "approved")
      )
    );

  const meta = hydrateCreatorMeta(u);
  const handle = u.handle || u.displayName || "Creador";
  const display = u.displayName || handle;
  const ig = instagramUrl(u.handle);
  const tt = tiktokProfileUrl(u.tiktokHandle);
  const color = avatarColor(u.id);
  const initials = initialsFromName(display);
  const themes =
    meta.categoriaSet.length > 0
      ? meta.categoriaSet.slice(0, 4).map((key) => {
          const [cat, sub] = key.split("|");
          return sub || cat;
        })
      : Array.isArray(u.contentThemes)
        ? u.contentThemes.slice(0, 4)
        : [];
  const collabs = Number(collabRow?.total) || 0;
  const igFollowers = meta.redes.Instagram || u.followers || 0;
  const ttFollowers = meta.redes.TikTok || u.tiktokFollowers || 0;
  const zona = meta.ubicacion || u.city || u.province;

  return (
    <>
      <div className="topbar">
        <div>
          <Link href="/dashboard/explorar" className="back-link">
            ← Creadores
          </Link>
          <h1>{display}</h1>
          <div className="sub">
            Perfil del creador · lo que compartió en CONNECTA
          </div>
        </div>
      </div>

      <div className="content portfolio-page">
        <section className="portfolio-hero">
          <div
            className="portfolio-avatar"
            style={{ background: color }}
            aria-hidden
          >
            {u.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.avatarUrl} alt="" />
            ) : (
              initials
            )}
          </div>

          <div className="portfolio-hero-copy">
            <p className="portfolio-kicker">Creador</p>
            <h2 className="portfolio-name">
              {u.handle ? `@${u.handle.replace(/^@/, "")}` : display}
            </h2>
            {u.displayName && u.handle ? (
              <p className="portfolio-sub">{u.displayName}</p>
            ) : null}

            <div className="portfolio-meta-row">
              {zona ? <span className="tag-pill">{zona}</span> : null}
              {meta.genero ? <span className="tag-pill">{meta.genero}</span> : null}
              {themes.map((t) => (
                <span key={t} className="tag-pill">
                  {t}
                </span>
              ))}
            </div>

            <div className="portfolio-actions">
              {ig ? (
                <a
                  href={ig}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  Instagram →
                </a>
              ) : null}
              {tt ? (
                <a
                  href={tt}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  TikTok →
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="portfolio-kpi-grid" aria-label="Métricas">
          <div className="portfolio-kpi">
            <b>{posts.length}</b>
            <span>Publicaciones</span>
          </div>
          <div className="portfolio-kpi">
            <b>{igFollowers.toLocaleString("es-AR")}</b>
            <span>Seguidores IG</span>
          </div>
          {u.tiktokHandle || ttFollowers > 0 ? (
            <div className="portfolio-kpi">
              <b>{ttFollowers.toLocaleString("es-AR")}</b>
              <span>Seguidores TikTok</span>
            </div>
          ) : null}
          <div className="portfolio-kpi">
            <b>{collabs}</b>
            <span>Colaboraciones</span>
          </div>
          {meta.idiomas.length > 0 ? (
            <div className="portfolio-kpi portfolio-kpi-wide">
              <b>{meta.idiomas.join(" · ")}</b>
              <span>Idiomas</span>
            </div>
          ) : null}
        </section>

        {(Object.keys(meta.redes).length > 0 ||
          (Array.isArray(u.platforms) && u.platforms.length > 0)) && (
          <section>
            <span className="section-label">Redes</span>
            <div className="portfolio-redes">
              {Object.entries(meta.redes).map(([platform, n]) => (
                <div key={platform} className="portfolio-red-item">
                  <strong>{platform}</strong>
                  <span>{(n || 0).toLocaleString("es-AR")} seguidores</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="portfolio-feed-block">
          <span className="section-label">Feed de acciones</span>
          <div className="creator-portfolio portfolio-feed-card">
            <CreatorFeed posts={posts} creatorHandle={u.handle} />
          </div>
        </section>
      </div>
    </>
  );
}
