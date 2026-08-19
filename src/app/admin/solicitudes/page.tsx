import Link from "next/link";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { AdminAccountStatusButtons } from "@/components/AdminAccountStatusButtons";
import { InstagramLink } from "@/components/InstagramLink";
import { getDb } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { roleLabel } from "@/lib/roles";

function SolicitudRow({
  u,
  ready,
}: {
  u: Profile;
  ready: boolean;
}) {
  return (
    <tr>
      <td>
        <Link href={`/admin/usuarios/${u.id}`} className="table-link">
          {u.displayName || u.brandName || "Sin nombre"}
        </Link>
        {ready ? null : (
          <div className="cell-warn">Formulario incompleto</div>
        )}
      </td>
      <td>{roleLabel(u.role)}</td>
      <td>
        <div>{u.email || "—"}</div>
        {u.handle ? (
          <InstagramLink handle={u.handle} className="cell-link" />
        ) : u.brandName ? (
          <div className="cell-sub">{u.brandName}</div>
        ) : null}
      </td>
      <td className="ct-empty">{u.createdAt.toLocaleDateString("es-AR")}</td>
      <td>
        <div className="cell-actions">
          {ready ? (
            <AdminAccountStatusButtons
              profileId={u.id}
              currentStatus={u.accountStatus}
            />
          ) : (
            <span className="cell-sub">Completar ficha antes de aceptar</span>
          )}
          <Link href={`/admin/usuarios/${u.id}`} className="cell-link">
            Ver ficha →
          </Link>
        </div>
      </td>
    </tr>
  );
}

function SolicitudTable({
  rows,
  ready,
}: {
  rows: Profile[];
  ready: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p>
          {ready
            ? "No hay solicitudes listas para aceptar."
            : "Nadie dejó el formulario a medias."}
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="creator-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Contacto</th>
            <th>Alta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <SolicitudRow key={u.id} u={u} ready={ready} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminSolicitudesPage() {
  const db = getDb();
  const pending = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.accountStatus, "pending"),
        inArray(profiles.role, ["brand", "creator"])
      )
    )
    .orderBy(desc(profiles.createdAt));

  const ready = pending.filter((u) => u.onboardingCompleted);
  const incomplete = pending.filter((u) => !u.onboardingCompleted);

  const recentDecided = await db
    .select()
    .from(profiles)
    .where(
      and(
        ne(profiles.accountStatus, "pending"),
        inArray(profiles.role, ["brand", "creator"])
      )
    )
    .orderBy(desc(profiles.reviewedAt))
    .limit(10);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Solicitudes</h1>
          <div className="sub">
            Primero las fichas completas. Las incompletas no se aceptan desde
            acá.
          </div>
        </div>
      </div>

      <div className="content">
        <section>
          <span className="section-label">
            Listas para aceptar ({ready.length})
          </span>
          <SolicitudTable rows={ready} ready />
        </section>

        <section>
          <span className="section-label">
            Formulario incompleto ({incomplete.length})
          </span>
          <SolicitudTable rows={incomplete} ready={false} />
        </section>

        {recentDecided.length > 0 ? (
          <section>
            <span className="section-label">Revisadas recientemente</span>
            <ul className="row-list">
              {recentDecided.map((u) => (
                <li key={u.id}>
                  <div>
                    <Link
                      href={`/admin/usuarios/${u.id}`}
                      className="table-link"
                    >
                      {u.displayName || u.brandName || "Sin nombre"}
                    </Link>
                    <span className="cell-sub"> · {roleLabel(u.role)}</span>
                  </div>
                  <span
                    className={`status-badge ${
                      u.accountStatus === "approved" ? "status-ok" : "status-bad"
                    }`}
                  >
                    {u.accountStatus === "approved" ? "Aprobada" : "Rechazada"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
