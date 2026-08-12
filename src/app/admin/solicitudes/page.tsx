import Link from "next/link";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { AdminAccountStatusButtons } from "@/components/AdminAccountStatusButtons";
import { InstagramLink } from "@/components/InstagramLink";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { roleLabel } from "@/lib/roles";

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
            Revisá altas de marcas e influencers antes de darles acceso
          </div>
        </div>
      </div>

      <div className="content">
        <section>
          <span className="section-label">Sin revisar ({pending.length})</span>
          {pending.length === 0 ? (
            <div className="empty-state">
              <p>No hay solicitudes pendientes.</p>
            </div>
          ) : (
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
                  {pending.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link
                          href={`/admin/usuarios/${u.id}`}
                          className="table-link"
                        >
                          {u.displayName || u.brandName || "Sin nombre"}
                        </Link>
                        {u.onboardingCompleted ? null : (
                          <div className="cell-warn">Formulario incompleto</div>
                        )}
                      </td>
                      <td>{roleLabel(u.role)}</td>
                      <td>
                        <div>{u.email || "—"}</div>
                        {u.handle ? (
                          <InstagramLink
                            handle={u.handle}
                            className="cell-link"
                          />
                        ) : u.brandName ? (
                          <div className="cell-sub">{u.brandName}</div>
                        ) : null}
                      </td>
                      <td className="ct-empty">
                        {u.createdAt.toLocaleDateString("es-AR")}
                      </td>
                      <td>
                        <div className="cell-actions">
                          <AdminAccountStatusButtons
                            profileId={u.id}
                            currentStatus={u.accountStatus}
                          />
                          <Link
                            href={`/admin/usuarios/${u.id}`}
                            className="cell-link"
                          >
                            Ver ficha →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
