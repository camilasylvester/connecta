import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/ApplyForm";
import { Logo } from "@/components/Logo";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { redirectIfNotApproved } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import "./aplicar.css";

function profileSoughtLines(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const byNewline = normalized
    .split("\n")
    .map((s) => s.replace(/^[-–•]\s*/, "").trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const byBullet = normalized
    .split(/\s*[-–•]\s+/)
    .map((s) => s.replace(/^[.,;:]\s*/, "").trim())
    .filter(Boolean);
  if (byBullet.length > 1) return byBullet;

  return [normalized];
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = getDb();
  const eventRows = await db
    .select({
      event: events,
      brandName: profiles.brandName,
      brandDisplay: profiles.displayName,
    })
    .from(events)
    .leftJoin(profiles, eq(events.brandId, profiles.id))
    .where(eq(events.inviteToken, token))
    .limit(1);

  const row = eventRows[0];
  if (!row) notFound();
  const event = row.event;
  const brandLabel = row.brandName || row.brandDisplay || null;

  const { userId } = await auth();
  const profile = userId ? await ensureProfile() : null;
  if (profile) redirectIfNotApproved(profile);

  let existingApp = null;
  if (profile) {
    const apps = await db
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(
        and(
          eq(applications.eventId, event.id),
          eq(applications.creatorId, profile.id)
        )
      )
      .limit(1);
    existingApp = apps[0] || null;
  }

  const dateLabel = event.eventDate
    ? new Date(event.eventDate + "T12:00:00").toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const images = Array.isArray(event.imageUrls) ? event.imageUrls : [];
  const cover = images[0] || null;
  const thumbs = images.slice(1);
  const soughtLines = event.profileSought
    ? profileSoughtLines(event.profileSought)
    : [];

  const metaItems = [
    event.location,
    dateLabel,
    event.category,
  ].filter(Boolean) as string[];

  return (
    <div className="apply-page">
      <div className="apply-shell">
        <header className="apply-top">
          <Logo href="/" />
          <span className="apply-eyebrow">Invitación privada</span>
        </header>

        <section>
          <h1 className="apply-title">{event.title}</h1>
          {brandLabel ? (
            <p className="apply-brand">Organiza {brandLabel}</p>
          ) : null}
          {metaItems.length > 0 ? (
            <ul className="apply-meta">
              {metaItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {cover ? (
          <div className="apply-media">
            <div className="apply-media-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" />
            </div>
            {thumbs.length > 0 ? (
              <div className="apply-media-thumbs">
                {thumbs.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {event.description ? (
          <section className="apply-section">
            <h2 className="apply-section-label">Sobre el evento</h2>
            <p className="apply-prose">{event.description}</p>
          </section>
        ) : null}

        {soughtLines.length > 0 ? (
          <section className="apply-section">
            <h2 className="apply-section-label">Perfil buscado</h2>
            {soughtLines.length === 1 ? (
              <p className="apply-prose">{soughtLines[0]}</p>
            ) : (
              <ul className="apply-profile-list">
                {soughtLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <p className="apply-status">
          {event.quota} cupos ·{" "}
          <strong>
            {event.status === "active"
              ? "Abierto a postulaciones"
              : event.status === "draft"
                ? "Pendiente de publicación"
                : "Cerrado"}
          </strong>
        </p>

        <div className="apply-action">
          {event.status === "draft" ? (
            <p>
              Este evento todavía no fue aceptado por CONNECTA. Cuando esté
              publicado vas a poder postularte.
            </p>
          ) : event.status !== "active" ? (
            <p>Este evento ya no acepta postulaciones.</p>
          ) : !userId ? (
            <>
              <h2>Postulate</h2>
              <p>
                Creá tu cuenta o iniciá sesión para enviar tu postulación. La
                marca va a poder ver tu Instagram.
              </p>
              <div className="apply-ctas">
                <Link
                  href={`/registro?role=creator&next=${encodeURIComponent(`/aplicar/${token}`)}`}
                  className="apply-btn apply-btn-solid"
                >
                  Crear cuenta
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(`/aplicar/${token}`)}`}
                  className="apply-btn apply-btn-ghost"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </>
          ) : profile?.role === "brand" || profile?.role === "admin" ? (
            <p>
              Estás logueado como{" "}
              {profile.role === "admin" ? "admin" : "marca"}.{" "}
              <Link
                href={profile.role === "admin" ? "/admin" : "/dashboard"}
                className="apply-link"
              >
                Ir al panel →
              </Link>
            </p>
          ) : existingApp ? (
            <>
              <h2>Ya te postulaste</h2>
              <p>
                Estado:{" "}
                <strong>
                  {existingApp.status === "pending"
                    ? "Pendiente de revisión"
                    : existingApp.status === "approved"
                      ? "Aprobada"
                      : "Rechazada"}
                </strong>
              </p>
              <p style={{ marginTop: 16 }}>
                <Link href="/mis-postulaciones" className="apply-link">
                  Ver mis postulaciones →
                </Link>
              </p>
            </>
          ) : (
            <div className="apply-form-wrap">
              <ApplyForm eventId={event.id} profile={profile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
