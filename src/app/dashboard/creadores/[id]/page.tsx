import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CreatorFeed } from "@/components/CreatorFeed";
import { CreatorFicha } from "@/components/CreatorFicha";
import { isAllowedStoredImageUrl } from "@/lib/image-compress";
import { getDb } from "@/db";
import { creatorPosts, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import { hydrateCreatorMeta } from "@/lib/creator-search";
import { instagramUrl } from "@/lib/instagram";
import { whatsappUrl } from "@/lib/phone";
import { tiktokProfileUrl } from "@/lib/posts";
import { initialsFromName } from "@/app/dashboard/brand-helpers";

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

  const meta = hydrateCreatorMeta(u);
  const display = u.displayName || u.handle || "Creador";
  const ig = instagramUrl(u.handle);
  const tt = tiktokProfileUrl(u.tiktokHandle);
  const wa = whatsappUrl(u.phone);
  const initials = initialsFromName(display);
  const themeSource =
    (Array.isArray(u.contentThemes) && u.contentThemes[0]) ||
    meta.categoriaSet[0] ||
    "";
  const pill = themeSource.split(/[·|]/)[0].trim() || null;
  const igFollowers = meta.redes.Instagram || u.followers || 0;
  const ttFollowers = meta.redes.TikTok || u.tiktokFollowers || 0;
  const zona = meta.ubicacion || u.city || u.province;
  const handleLabel = u.handle ? `@${u.handle.replace(/^@/, "")}` : null;
  const fichaRows: Array<[string, ReactNode]> = [];
  if (zona) fichaRows.push(["Ubicación", zona]);
  if (handleLabel && ig) {
    fichaRows.push([
      "Instagram",
      <a key="ig" href={ig} target="_blank" rel="noopener noreferrer">
        {handleLabel}
      </a>,
    ]);
  }
  fichaRows.push(["Seguidores", igFollowers.toLocaleString("es-AR")]);
  if (u.tiktokHandle || ttFollowers > 0) {
    fichaRows.push([
      "TikTok",
      u.tiktokHandle && tt ? (
        <a key="tt" href={tt} target="_blank" rel="noopener noreferrer">
          {u.tiktokHandle}
        </a>
      ) : (
        `${ttFollowers.toLocaleString("es-AR")} seguidores`
      ),
    ]);
    if (u.tiktokHandle && ttFollowers > 0) {
      fichaRows.push(["Seguidores TikTok", ttFollowers.toLocaleString("es-AR")]);
    }
  }
  if (wa) {
    fichaRows.push([
      "WhatsApp",
      <a key="wa" href={wa} target="_blank" rel="noopener noreferrer">
        Abrir chat
      </a>,
    ]);
  }

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
        <CreatorFicha
          name={display}
          subtitle={u.handle ? `@${u.handle.replace(/^@/, "")}` : null}
          subtitleHref={ig}
          avatarUrl={
            u.avatarUrl && isAllowedStoredImageUrl(u.avatarUrl)
              ? u.avatarUrl
              : null
          }
          initials={initials}
          pill={pill}
          rows={fichaRows}
        />

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
