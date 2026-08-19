import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AdminAccountStatusButtons } from "@/components/AdminAccountStatusButtons";
import { AdminDeleteUserButton } from "@/components/AdminDeleteUserButton";
import { CreatorFeed } from "@/components/CreatorFeed";
import { InstagramLink } from "@/components/InstagramLink";
import { ProfileEditClient } from "@/components/ProfileEditClient";
import { getDb } from "@/db";
import { creatorPosts, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import { instagramUrl } from "@/lib/instagram";
import { profileToOnboarding } from "@/lib/onboarding";
import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await ensureProfile();
  const db = getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  const u = rows[0];
  if (!u) notFound();

  const posts =
    u.role === "creator" || u.role === "admin"
      ? await db
          .select()
          .from(creatorPosts)
          .where(eq(creatorPosts.creatorId, id))
          .orderBy(desc(creatorPosts.createdAt))
      : [];

  const igUrl = instagramUrl(u.handle);
  const themes = Array.isArray(u.contentThemes) ? u.contentThemes : [];
  const platforms = Array.isArray(u.platforms) ? u.platforms : [];
  const goals = Array.isArray(u.goals) ? u.goals : [];
  const canDelete = me?.role === "admin" && me.id !== u.id;
  const canReview =
    me?.role === "admin" && u.role !== "admin" && me.id !== u.id;
  const canEditProfile =
    me?.role === "admin" && (u.role === "brand" || u.role === "creator");

  const statusLabel =
    u.accountStatus === "pending"
      ? "Pendiente de revisión"
      : u.accountStatus === "approved"
        ? "Aprobada"
        : "Rechazada";
  const statusClass =
    u.accountStatus === "pending"
      ? "status-wait"
      : u.accountStatus === "approved"
        ? "status-ok"
        : "status-bad";

  return (
    <>
      <div className="topbar">
        <div style={{ width: "100%" }}>
          <Link
            href={
              u.accountStatus === "pending"
                ? "/admin/solicitudes"
                : "/admin/usuarios"
            }
            className="back-link"
          >
            ← {u.accountStatus === "pending" ? "Solicitudes" : "Usuarios"}
          </Link>
          <div className="detail-header" style={{ marginBottom: 0 }}>
            <div>
              <h1>{u.displayName || "Sin nombre"}</h1>
              <div className="badge-row">
                <RolePill role={u.role} />
                <span className={`status-badge ${statusClass}`}>
                  {statusLabel}
                </span>
                {u.onboardingCompleted ? (
                  <span className="status-badge status-ok">
                    Formulario completo
                  </span>
                ) : (
                  <span className="status-badge status-borrador">
                    Sin formulario
                  </span>
                )}
              </div>
            </div>
            <div className="detail-actions">
              {igUrl ? (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  Abrir Instagram {u.handle} →
                </a>
              ) : null}
              {canDelete ? (
                <AdminDeleteUserButton
                  profileId={u.id}
                  label={u.displayName || u.handle || u.email || u.id}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        {canReview ? (
          <div className="invite-box">
            <h3>Revisar solicitud de acceso</h3>
            {u.accountStatus === "pending" && !u.onboardingCompleted ? (
              <p className="cell-sub">
                Formulario incompleto. Completá o pedile que termine la ficha
                antes de aceptar.
              </p>
            ) : null}
            <AdminAccountStatusButtons
              profileId={u.id}
              currentStatus={u.accountStatus}
              allowApprove={u.onboardingCompleted}
            />
          </div>
        ) : null}

        {canEditProfile ? (
          <section className="data-section">
            <div className="data-section-head">
              <h3>Editar ficha</h3>
            </div>
            <div className="data-section-body" style={{ padding: "20px 0" }}>
              <p className="cell-sub" style={{ marginBottom: 16 }}>
                Como admin podés corregir nombre, Instagram, foto, seguidores y
                el resto de datos del perfil.
              </p>
              <ProfileEditClient
                initial={profileToOnboarding(u)}
                variant="dark"
                profileId={u.id}
              />
            </div>
          </section>
        ) : null}

        <Section title="Datos generales">
          <Row label="Nombre y apellido" value={u.displayName} />
          <Row
            label="Instagram"
            value={
              u.handle ? (
                <InstagramLink handle={u.handle} className="cell-link" />
              ) : (
                "—"
              )
            }
          />
          <Row label="TikTok" value={u.tiktokHandle} />
          <Row label="Provincia" value={u.province || u.city} />
          <Row label="Edad" value={u.age != null ? String(u.age) : null} />
          <Row label="Teléfono" value={u.phone} />
          <Row label="Email de contacto" value={u.email} />
          <Row label="Perfil" value={roleLabel(u.role)} />
          <Row label="Estado de cuenta" value={statusLabel} />
        </Section>

        {u.role === "brand" ? (
          <Section title="Información de la empresa">
            <Row label="Marca / empresa" value={u.brandName} />
            <Row label="Rubro / Industria" value={u.industry || u.category} />
            <Row
              label="Ciudad / Provincia"
              value={u.companyLocation || u.city}
            />
            <Row label="Persona de contacto" value={u.contactPerson} />
            <Row label="Mail / WhatsApp" value={u.contactChannel} />
            <Row
              label="Experiencia con influencers"
              value={u.influencerExperience}
            />
            <Row
              label="Objetivos"
              value={goals.length ? goals.join(" · ") : null}
            />
          </Section>
        ) : null}

        {u.role === "creator" ? (
          <Section title="Perfil de creador">
            <Row
              label="Temáticas"
              value={themes.length ? themes.join(" · ") : null}
            />
            <Row
              label="Plataformas"
              value={platforms.length ? platforms.join(" · ") : null}
            />
            <Row
              label="Seguidores Instagram"
              value={
                u.followers != null
                  ? u.followers.toLocaleString("es-AR")
                  : null
              }
            />
            <Row
              label="Seguidores TikTok"
              value={
                u.tiktokFollowers != null
                  ? u.tiktokFollowers.toLocaleString("es-AR")
                  : null
              }
            />
          </Section>
        ) : null}

        {u.role === "creator" ? (
          <section className="data-section">
            <div className="data-section-head">
              <h3>Feed de acciones</h3>
              <Link
                href={`/dashboard/creadores/${u.id}`}
                className="cell-link"
              >
                Ver portfolio →
              </Link>
            </div>
            <div className="data-section-body">
              <CreatorFeed posts={posts} creatorHandle={u.handle} />
            </div>
          </section>
        ) : null}

        <Section title="Sistema">
          <Row label="ID" value={u.id} />
          <Row label="Alta" value={u.createdAt.toLocaleString("es-AR")} />
          <Row
            label="Última actualización"
            value={u.updatedAt.toLocaleString("es-AR")}
          />
          <Row
            label="Revisado"
            value={
              u.reviewedAt ? u.reviewedAt.toLocaleString("es-AR") : null
            }
          />
        </Section>

        {canDelete ? (
          <section className="danger-zone">
            <div>
              <h3 className="section-label">Zona de peligro</h3>
              <p>
                Solo admins. Borra el perfil de CONNECTA
                {u.role === "brand"
                  ? ", sus eventos y postulaciones"
                  : u.role === "creator"
                    ? " y sus postulaciones"
                    : ""}
                . No se puede deshacer.
              </p>
            </div>
            <AdminDeleteUserButton
              profileId={u.id}
              label={u.displayName || u.handle || u.email || u.id}
            />
          </section>
        ) : me?.id === u.id ? (
          <p className="cell-sub">
            No podés borrar tu propia cuenta de admin desde acá.
          </p>
        ) : null}
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="data-section">
      <div className="data-section-head">
        <h3>{title}</h3>
      </div>
      <dl className="data-rows">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="data-row">
      <dt>{label}</dt>
      <dd>{value || <span className="ct-empty">—</span>}</dd>
    </div>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const variants: Record<UserRole, string> = {
    admin: "status-wait",
    brand: "status-activo",
    creator: "status-ok",
  };
  return (
    <span className={`status-badge ${variants[role]}`}>{roleLabel(role)}</span>
  );
}
