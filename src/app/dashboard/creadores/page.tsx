import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import {
  avatarColor,
  formatEventDate,
  initialsFromName,
} from "../brand-helpers";

type CreatorRow = {
  id: string;
  handle: string | null;
  displayName: string | null;
  category: string | null;
  followers: number | null;
  city: string | null;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  lastAt: Date | null;
};

export default async function CreadoresPage() {
  const profile = await ensureProfile();
  const isAdmin = profile?.role === "admin";
  const db = getDb();

  const brandEvents = isAdmin
    ? await db.select({ id: events.id }).from(events)
    : await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.brandId, profile!.id));

  const eventIds = brandEvents.map((e) => e.id);

  let creators: CreatorRow[] = [];

  if (eventIds.length > 0) {
    const rows = await db
      .select({
        creatorId: applications.creatorId,
        status: applications.status,
        createdAt: applications.createdAt,
        handle: profiles.handle,
        displayName: profiles.displayName,
        category: profiles.category,
        followers: profiles.followers,
        city: profiles.city,
      })
      .from(applications)
      .innerJoin(profiles, eq(applications.creatorId, profiles.id))
      .where(inArray(applications.eventId, eventIds))
      .orderBy(desc(applications.createdAt));

    const map = new Map<string, CreatorRow>();
    for (const row of rows) {
      const existing = map.get(row.creatorId);
      if (!existing) {
        map.set(row.creatorId, {
          id: row.creatorId,
          handle: row.handle,
          displayName: row.displayName,
          category: row.category,
          followers: row.followers,
          city: row.city,
          total: 1,
          approved: row.status === "approved" ? 1 : 0,
          pending: row.status === "pending" ? 1 : 0,
          rejected: row.status === "rejected" ? 1 : 0,
          lastAt: row.createdAt,
        });
      } else {
        existing.total += 1;
        if (row.status === "approved") existing.approved += 1;
        if (row.status === "pending") existing.pending += 1;
        if (row.status === "rejected") existing.rejected += 1;
        if (
          row.createdAt &&
          (!existing.lastAt || row.createdAt > existing.lastAt)
        ) {
          existing.lastAt = row.createdAt;
        }
      }
    }
    creators = [...map.values()].sort((a, b) => b.total - a.total);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Creadores</h1>
          <div className="sub">
            Tu historial y todo el resto de la comunidad de CONNECTA
          </div>
        </div>
      </div>
      <div className="content">
        <div className="tabs-row">
          <button type="button" className="tab-pill is-active">
            Mi CRM
          </button>
        </div>

        {creators.length === 0 ? (
          <div className="empty-state">
            <h3>Todavía no hay creadores en tu CRM</h3>
            <p>
              Cuando alguien se postule a tus eventos, vas a verlos acá con el
              historial de postulaciones.
            </p>
          </div>
        ) : (
          <>
            <div className="db-count">
              {creators.length} creador
              {creators.length === 1 ? "" : "es"}
            </div>
            <div className="table-wrap">
              <table className="creator-table">
                <thead>
                  <tr>
                    <th>Creador</th>
                    <th>Categoría</th>
                    <th>Seguidores</th>
                    <th>Postulaciones</th>
                    <th>Confirmados</th>
                    <th>Pendientes</th>
                    <th>Última vez</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c) => {
                    const label =
                      c.handle || c.displayName || "Sin nombre";
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="ct-name">
                            <div
                              className="ct-avatar"
                              style={{
                                background: avatarColor(c.id),
                              }}
                            >
                              {initialsFromName(label)}
                            </div>
                            <div>
                              <div>
                                <Link
                                  href={`/dashboard/creadores/${c.id}`}
                                  className="font-bold hover:text-purple"
                                >
                                  {label}
                                </Link>
                              </div>
                              {c.city ? (
                                <div
                                  style={{
                                    fontSize: 11.5,
                                    color: "var(--faint)",
                                  }}
                                >
                                  {c.city}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>{c.category || <span className="ct-empty">—</span>}</td>
                        <td>
                          {(c.followers || 0).toLocaleString("es-AR")}
                        </td>
                        <td>{c.total}</td>
                        <td>
                          {c.approved > 0 ? (
                            c.approved
                          ) : (
                            <span className="ct-empty">0</span>
                          )}
                        </td>
                        <td>
                          {c.pending > 0 ? (
                            c.pending
                          ) : (
                            <span className="ct-empty">0</span>
                          )}
                        </td>
                        <td>
                          {c.lastAt ? (
                            formatEventDate(
                              c.lastAt.toISOString().slice(0, 10)
                            )
                          ) : (
                            <span className="ct-empty">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
