import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { count, desc, eq } from "drizzle-orm";
import { EventosFeedClient, type FeedEventCard } from "@/components/EventosFeedClient";
import { LogoWordmark } from "@/components/LogoWordmark";
import { LogoutButton } from "@/components/LogoutButton";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { redirectIfNotApproved, redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import "./eventos-feed.css";

const CAT_MAP: Record<string, { slug: string; label: string }> = {
  gastronomia: { slug: "gastronomia", label: "Gastronomía" },
  gastronomía: { slug: "gastronomia", label: "Gastronomía" },
  fitness: { slug: "fitness", label: "Fitness" },
  running: { slug: "fitness", label: "Fitness" },
  moda: { slug: "moda", label: "Moda" },
  arte: { slug: "arte", label: "Arte" },
  lifestyle: { slug: "lifestyle", label: "Lifestyle" },
};

function parseCategorySlugs(raw: string | null): string[] {
  if (!raw?.trim()) return ["lifestyle"];

  const parts = raw
    .split(/[,/|;\-–—]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const slugs = new Set<string>();
  for (const part of parts) {
    const mapped = CAT_MAP[part];
    if (mapped) {
      slugs.add(mapped.slug);
      continue;
    }
    for (const [key, value] of Object.entries(CAT_MAP)) {
      if (part.includes(key) || key.includes(part)) {
        slugs.add(value.slug);
      }
    }
  }

  return slugs.size > 0 ? Array.from(slugs) : ["lifestyle"];
}

function formatPlace(location: string | null, eventDate: string | null): string {
  const parts: string[] = [];
  if (location) parts.push(location);
  if (eventDate) {
    parts.push(
      new Date(eventDate + "T12:00:00").toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      })
    );
  }
  return parts.join(" · ") || "Fecha a confirmar";
}

function resolveStatus(
  approved: number,
  quota: number,
  eventDate: string | null
): "open" | "soon" | "full" {
  if (approved >= quota) return "full";
  if (eventDate) {
    const days =
      (new Date(eventDate + "T12:00:00").getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    if (days >= 0 && days <= 7) return "soon";
  }
  return "open";
}

const POSTERS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"];

export default async function EventosPage() {
  const { userId } = await auth();
  const profile = userId ? await ensureProfile() : null;
  if (profile) {
    redirectIfNotApproved(profile);
    await redirectIfPasswordMissing("/eventos");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      eventDate: events.eventDate,
      quota: events.quota,
      category: events.category,
      inviteToken: events.inviteToken,
      imageUrls: events.imageUrls,
      brandName: profiles.brandName,
      displayName: profiles.displayName,
    })
    .from(events)
    .leftJoin(profiles, eq(events.brandId, profiles.id))
    .where(eq(events.status, "active"))
    .orderBy(desc(events.createdAt));

  const approvedRows = await db
    .select({
      eventId: applications.eventId,
      total: count(),
    })
    .from(applications)
    .where(eq(applications.status, "approved"))
    .groupBy(applications.eventId);

  const approvedMap = new Map(
    approvedRows.map((r) => [r.eventId, Number(r.total) || 0])
  );

  const cards: FeedEventCard[] = rows.map((row, i) => {
    const catSlugs = parseCategorySlugs(row.category);
    const brand = row.brandName || row.displayName || "Marca";
    const approved = approvedMap.get(row.id) || 0;
    const images = Array.isArray(row.imageUrls) ? row.imageUrls : [];
    return {
      id: row.id,
      title: row.title,
      brand,
      cat: catSlugs[0],
      catSlugs,
      catLabel: row.category?.trim() || "Lifestyle",
      place: formatPlace(row.location, row.eventDate),
      status: resolveStatus(approved, row.quota, row.eventDate),
      poster: POSTERS[i % POSTERS.length],
      coverUrl: images[0] || null,
      href: `/aplicar/${row.inviteToken}`,
    };
  });

  const isCreator = profile?.role === "creator" || profile?.role === "admin";
  const profileCta = userId
    ? isCreator
      ? { href: "/mi-perfil", label: "Mi perfil" }
      : { href: "/dashboard/config", label: "Mi perfil" }
    : { href: "/registro?role=creator", label: "Crear mi perfil" };

  return (
    <div className="feed-page">
      <header className="feed-header">
        <div className="feed-nav">
          <Link href="/eventos" className="feed-logo" aria-label="Connecta, eventos">
            <LogoWordmark className="feed-logo-svg" />
          </Link>
          <nav className="feed-nav-links" aria-label="Navegación">
            <a href="#eventos" className="is-active">
              Eventos
            </a>
            <a href="#como-postularte">Cómo postularte</a>
            {userId ? <Link href="/mis-postulaciones">Mis postulaciones</Link> : null}
            <Link href={profileCta.href}>{profileCta.label}</Link>
          </nav>
          <div className="feed-nav-ctas">
            {userId ? (
              <LogoutButton className="feed-btn feed-btn-outline" />
            ) : (
              <>
                <Link href="/login?role=creator" className="feed-btn feed-btn-outline">
                  Ingresar
                </Link>
                <Link href="/registro?role=creator" className="feed-btn feed-btn-solid">
                  Crear cuenta
                </Link>
              </>
            )}
            <details className="feed-mobile-menu">
              <summary aria-label="Abrir menú">Menú</summary>
              <nav>
                <a href="#eventos">Eventos</a>
                <a href="#como-postularte">Cómo postularte</a>
                {userId ? (
                  <>
                    <Link href="/mis-postulaciones">Mis postulaciones</Link>
                    <Link href={profileCta.href}>{profileCta.label}</Link>
                  </>
                ) : (
                  <>
                    <Link href="/login?role=creator">Ingresar</Link>
                    <Link href="/registro?role=creator">Crear cuenta</Link>
                  </>
                )}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section className="feed-hero">
        <div className="feed-wrap feed-hero-frame">
          <span className="feed-corner feed-corner-left">ARG — BA</span>
          <span className="feed-corner feed-corner-right">FEED / EVENTOS</span>
          <div className="feed-hero-inner">
            <span className="feed-eyebrow">Para creadores</span>
            <h1>
              Encontrá tu próxima{" "}
              <span className="feed-accent">colaboración.</span>
            </h1>
            <p>
              Eventos publicados por marcas. Postulate al que va con tu estilo.
            </p>
            <div className="feed-hero-ctas">
              <a href="#eventos" className="feed-btn feed-btn-solid feed-btn-large">
                Ver eventos
              </a>
              <a href="#como-postularte" className="feed-btn feed-btn-outline feed-btn-large">
                Cómo postularte
              </a>
            </div>
          </div>
        </div>
      </section>

      <EventosFeedClient events={cards} />

      <section className="feed-how-section" id="como-postularte">
        <div className="feed-wrap">
          <div className="feed-how-head">
            <div>
              <span className="feed-eyebrow">Cómo postularte</span>
              <h2>Tres pasos, sin vueltas</h2>
            </div>
            <p>Elegí, postulá, esperá confirmación. Tu historial queda.</p>
          </div>
          <div className="feed-how-steps">
            <article className="feed-how-step">
              <span>01</span>
              <h4>Elegí un evento</h4>
              <p>
                Mirá qué busca la marca: estilo, contenido, ubicación.
              </p>
            </article>
            <article className="feed-how-step">
              <span>02</span>
              <h4>Postulate</h4>
              <p>
                Tu perfil ya tiene redes e historial — no repetís nada.
              </p>
            </article>
            <article className="feed-how-step">
              <span>03</span>
              <h4>Confirmación</h4>
              <p>
                La marca revisa. Si te acepta, queda en tu historial.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="feed-final-cta">
        <div className="feed-wrap">
          <span className="feed-eyebrow">Empezá hoy</span>
          <h2>
            Tu nombre, en <span className="feed-accent">la lista.</span>
          </h2>
          <p>
            {userId
              ? "Seguí postulándote a los eventos que te interesan."
              : "Creá tu perfil y empezá a postularte."}
          </p>
          <Link
            href={userId ? "#eventos" : "/registro?role=creator"}
            className="feed-btn feed-btn-solid feed-btn-large"
          >
            {userId ? "Ver eventos" : "Crear mi perfil"}
          </Link>
        </div>
      </section>

      <footer className="feed-footer">
        <div className="feed-wrap feed-footer-row">
          <div className="feed-logo">
            <LogoWordmark className="feed-logo-svg" />
          </div>
          <span className="feed-footer-meta">CONNECTA / 2026</span>
          <div className="feed-footer-links">
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
