import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = getDb();

  const base = db
    .select({
      id: applications.id,
      status: applications.status,
      message: applications.message,
      title: events.title,
      handle: profiles.handle,
      displayName: profiles.displayName,
    })
    .from(applications)
    .leftJoin(events, eq(applications.eventId, events.id))
    .leftJoin(profiles, eq(applications.creatorId, profiles.id))
    .orderBy(desc(applications.createdAt));

  const apps =
    status === "pending" || status === "approved" || status === "rejected"
      ? await db
          .select({
            id: applications.id,
            status: applications.status,
            message: applications.message,
            title: events.title,
            handle: profiles.handle,
            displayName: profiles.displayName,
          })
          .from(applications)
          .leftJoin(events, eq(applications.eventId, events.id))
          .leftJoin(profiles, eq(applications.creatorId, profiles.id))
          .where(eq(applications.status, status))
          .orderBy(desc(applications.createdAt))
      : await base;

  const statusLabel = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  } as const;

  const statusClass = {
    pending: "status-wait",
    approved: "status-ok",
    rejected: "status-bad",
  } as const;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Postulaciones</h1>
          <div className="sub">Todas las postulaciones de todas las marcas</div>
        </div>
      </div>
      <div className="content">
        <div className="tabs-row">
          {(
            [
              ["", "Todas"],
              ["pending", "Pendientes"],
              ["approved", "Aprobadas"],
              ["rejected", "Rechazadas"],
            ] as const
          ).map(([value, label]) => {
            const active = (status || "") === value;
            const href = value
              ? `/admin/postulaciones?status=${value}`
              : "/admin/postulaciones";
            return (
              <a
                key={label}
                href={href}
                className={`tab-pill${active ? " is-active" : ""}`}
              >
                {label}
              </a>
            );
          })}
        </div>

        {apps.length === 0 ? (
          <div className="empty-state">
            <p>No hay postulaciones.</p>
          </div>
        ) : (
          <ul className="row-list">
            {apps.map((app) => (
              <li key={app.id}>
                <div>
                  <div className="table-link">
                    {app.handle || app.displayName || "Creador"}
                  </div>
                  <div className="cell-sub">
                    → {app.title || "Evento"}
                    {app.message ? ` · “${app.message}”` : ""}
                  </div>
                </div>
                <span className={`status-badge ${statusClass[app.status]}`}>
                  {statusLabel[app.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
