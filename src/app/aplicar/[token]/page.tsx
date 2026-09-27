import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ApplyForm } from "@/components/ApplyForm";
import { EventInvite } from "@/components/EventInvite";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { redirectIfNotApproved, redirectIfPhoneMissing, redirectIfTermsMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { isAllowedStoredImageUrl } from "@/lib/image-compress";
import "./aplicar.css";

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
      brandId: profiles.id,
      brandName: profiles.brandName,
      brandDisplay: profiles.displayName,
      brandAvatar: profiles.avatarUrl,
    })
    .from(events)
    .leftJoin(profiles, eq(events.brandId, profiles.id))
    .where(eq(events.inviteToken, token))
    .limit(1);

  const row = eventRows[0];
  if (!row) notFound();
  const event = row.event;
  const brandLabel = row.brandName || row.brandDisplay || null;
  const brandHref = row.brandId ? `/marcas/${row.brandId}` : null;

  const { userId } = await auth();
  const profile = userId ? await ensureProfile() : null;
  if (profile && profile.role !== "admin") {
    // Pending creators can apply. Incomplete fichas finish onboarding, then
    // come back to this event. Admin se queda en la invitación para verla
    // igual que un influencer; si no, completar-perfil lo manda al panel.
    if (!profile.onboardingCompleted) {
      redirect(
        `/completar-perfil?next=${encodeURIComponent(`/aplicar/${token}`)}`
      );
    }
    redirectIfPhoneMissing(profile);
    redirectIfTermsMissing(profile);
    if (profile.accountStatus === "rejected") {
      redirectIfNotApproved(profile);
    }
  }

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

  const photos = (Array.isArray(event.imageUrls) ? event.imageUrls : []).filter(
    (url) => isAllowedStoredImageUrl(url)
  );
  const statusLabel =
    event.status === "active"
      ? "Abierto a postulaciones"
      : event.status === "draft"
        ? "Pendiente de publicación"
        : "Cerrado";
  const rows: Array<[string, string]> = [];
  if (event.location) rows.push(["Lugar", event.location]);
  if (dateLabel) rows.push(["Fecha", dateLabel]);
  rows.push(["Cupos", String(event.quota)]);
  rows.push(["Estado", statusLabel]);
  const brandAvatar =
    row.brandAvatar && isAllowedStoredImageUrl(row.brandAvatar)
      ? row.brandAvatar
      : null;

  return (
    <div className="apply-page">
      <Link href="/eventos" className="apply-back">
        ← Volver a eventos
      </Link>
      <EventInvite
        title={event.title}
        brandLabel={brandLabel}
        brandHref={brandHref}
        brandAvatarUrl={brandAvatar}
        description={event.description}
        category={event.category}
        rows={rows}
        sought={event.profileSought?.trim() || null}
        photos={photos}
      >
        <div className="apply-actions">
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
          ) : profile?.role === "brand" ? (
            <p>
              Estás logueado como marca.{" "}
              <Link href="/dashboard" className="apply-link">
                Ir al panel →
              </Link>
            </p>
          ) : profile?.role === "admin" ? (
            <>
              <h2>Postulate</h2>
              <p>
                Así ve esta invitación un influencer. Desde la cuenta admin no
                se envía la postulación.
              </p>
            </>
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
      </EventInvite>
    </div>
  );
}
