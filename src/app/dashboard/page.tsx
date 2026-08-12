import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, events } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import { posterClass, statusMeta } from "./brand-helpers";

export default async function DashboardResumenPage() {
  const profile = await ensureProfile();
  const isAdmin = profile?.role === "admin";
  const db = getDb();

  const eventList = isAdmin
    ? await db.select().from(events).orderBy(desc(events.createdAt))
    : await db
        .select()
        .from(events)
        .where(eq(events.brandId, profile!.id))
        .orderBy(desc(events.createdAt));

  const eventIds = eventList.map((e) => e.id);

  const appRows =
    eventIds.length === 0
      ? []
      : await db
          .select({
            eventId: applications.eventId,
            status: applications.status,
          })
          .from(applications)
          .where(inArray(applications.eventId, eventIds));

  const byEvent = new Map<
    string,
    { total: number; pending: number; approved: number }
  >();
  for (const id of eventIds) {
    byEvent.set(id, { total: 0, pending: 0, approved: 0 });
  }
  for (const row of appRows) {
    const bucket = byEvent.get(row.eventId);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.status === "pending") bucket.pending += 1;
    if (row.status === "approved") bucket.approved += 1;
  }

  const activeCount = eventList.filter((e) => e.status === "active").length;
  const totalApps = appRows.length;
  const confirmed = appRows.filter((a) => a.status === "approved").length;
  const pending = appRows.filter((a) => a.status === "pending").length;

  const needsAttention = eventList
    .map((ev) => {
      const stats = byEvent.get(ev.id)!;
      return { ev, ...stats };
    })
    .filter((x) => x.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 5);

  const recent = eventList.slice(0, 6);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Resumen</h1>
          <div className="sub">Cómo está tu cuenta hoy</div>
        </div>
      </div>
      <div className="content">
        <div className="kpi-row">
          <div className="kpi-card">
            <b>{activeCount}</b>
            <span>Eventos activos</span>
          </div>
          <div className="kpi-card">
            <b>{totalApps}</b>
            <span>Postulaciones totales</span>
          </div>
          <div className="kpi-card">
            <b>{confirmed}</b>
            <span>Creadores confirmados</span>
          </div>
          <div className="kpi-card highlight">
            <b>{pending}</b>
            <span>Postulaciones sin revisar</span>
          </div>
        </div>

        <div className="attention-box">
          <h3>Eventos que necesitan atención</h3>
          {needsAttention.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
              No hay postulaciones pendientes por revisar.
            </p>
          ) : (
            needsAttention.map(({ ev, total, approved, pending: pend }) => (
              <div className="attention-row" key={ev.id}>
                <div className="info">
                  <h5>{ev.title}</h5>
                  <span>
                    {profile?.brandName ? `${profile.brandName} · ` : ""}
                    {total} postulaciones · {approved} confirmados
                  </span>
                </div>
                <div>
                  <span className="badge-alert">{pend} sin revisar</span>
                  <Link
                    href={`/dashboard/eventos/${ev.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="summary-cols">
          <div className="attention-box" style={{ marginBottom: 0 }}>
            <h3>Últimos eventos</h3>
            {recent.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
                Todavía no creaste eventos.{" "}
                <Link href="/dashboard/eventos/nuevo">Crear el primero →</Link>
              </p>
            ) : (
              recent.map((ev) => {
                const meta = statusMeta(ev.status);
                return (
                  <Link
                    key={ev.id}
                    href={`/dashboard/eventos/${ev.id}`}
                    className="mini-event-row"
                  >
                    <div className={`sq ${posterClass(ev.id)}`} />
                    <div className="nm">{ev.title}</div>
                    <div className="ct">{meta.label}</div>
                  </Link>
                );
              })
            )}
          </div>
          <div className="attention-box" style={{ marginBottom: 0 }}>
            <h3>Reseñas pendientes de dejar</h3>
            <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
              Pronto vas a poder calificar a los creadores con los que
              trabajaste.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
