import Link from "next/link";
import { count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { posterClass, statusMeta } from "@/app/dashboard/brand-helpers";

export default async function AdminHomePage() {
  const db = getDb();

  const [
    brands,
    creators,
    admins,
    eventCount,
    appCount,
    pending,
    pendingSignups,
    pendingEvents,
    eventList,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.role, "brand")),
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.role, "creator")),
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.role, "admin")),
    db.select({ value: count() }).from(events),
    db.select({ value: count() }).from(applications),
    db
      .select({ value: count() })
      .from(applications)
      .where(eq(applications.status, "pending")),
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, "pending")),
    db
      .select({ value: count() })
      .from(events)
      .where(eq(events.status, "draft")),
    db.select().from(events).orderBy(desc(events.createdAt)),
  ]);

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

  const brandRows = await db
    .select({ id: profiles.id, brandName: profiles.brandName })
    .from(profiles);
  const brandNameById = new Map(
    brandRows.map((b) => [b.id, b.brandName?.trim() || null])
  );

  const needsAttention = eventList
    .map((ev) => {
      const stats = byEvent.get(ev.id)!;
      return { ev, ...stats };
    })
    .filter((x) => x.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 5);

  const recent = eventList.slice(0, 6);
  const recentCreators = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, "creator"))
    .orderBy(desc(profiles.createdAt))
    .limit(5);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Resumen</h1>
          <div className="sub">Vista total de CONNECTA — marcas, creadores y actividad</div>
        </div>
      </div>

      <div className="content">
        <div className="kpi-row">
          <Link href="/admin/usuarios?role=brand" className="kpi-card">
            <b>{brands[0]?.value ?? 0}</b>
            <span>Marcas</span>
          </Link>
          <Link href="/admin/usuarios?role=creator" className="kpi-card">
            <b>{creators[0]?.value ?? 0}</b>
            <span>Influencers</span>
          </Link>
          <Link href="/admin/solicitudes" className="kpi-card highlight">
            <b>{pendingSignups[0]?.value ?? 0}</b>
            <span>Solicitudes sin revisar</span>
          </Link>
          <Link href="/admin/eventos" className="kpi-card highlight">
            <b>{pendingEvents[0]?.value ?? 0}</b>
            <span>Eventos por aceptar</span>
          </Link>
          <Link
            href="/admin/postulaciones?status=pending"
            className="kpi-card"
          >
            <b>{pending[0]?.value ?? 0}</b>
            <span>Postulaciones sin revisar</span>
          </Link>
          <Link href="/admin/eventos" className="kpi-card">
            <b>{eventCount[0]?.value ?? 0}</b>
            <span>Eventos</span>
          </Link>
        </div>

        <div className="attention-box">
          <h3>Eventos que necesitan atención</h3>
          {needsAttention.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
              No hay postulaciones pendientes por revisar.
            </p>
          ) : (
            needsAttention.map(({ ev, total, approved, pending: pend }) => {
              const brand = brandNameById.get(ev.brandId);
              return (
              <div className="attention-row" key={ev.id}>
                <div className="info">
                  <h5>{ev.title}</h5>
                  <span>
                    {brand ? `${brand} · ` : ""}
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
              );
            })
          )}
        </div>

        <div className="summary-cols">
          <div className="attention-box" style={{ marginBottom: 0 }}>
            <h3>Últimos eventos</h3>
            {recent.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
                Todavía no hay eventos en la plataforma.
              </p>
            ) : (
              recent.map((ev) => {
                const meta = statusMeta(ev.status);
                return (
                  <Link
                    key={ev.id}
                    href={`/admin/eventos`}
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
            <h3>Últimos influencers</h3>
            {recentCreators.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--faint)" }}>
                Todavía no hay creadores registrados.
              </p>
            ) : (
              recentCreators.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/usuarios/${c.id}`}
                  className="mini-event-row"
                >
                  <div className={`sq ${posterClass(c.id)}`} />
                  <div className="nm">
                    {c.displayName || c.handle || "Sin nombre"}
                  </div>
                  <div className="ct">{c.handle || "Ver ficha"}</div>
                </Link>
              ))
            )}
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                color: "var(--faint)",
              }}
            >
              Admins: {admins[0]?.value ?? 0} · Postulaciones totales:{" "}
              {appCount[0]?.value ?? 0}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
