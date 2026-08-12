import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import {
  EventsListClient,
  type EventCardData,
} from "../EventsListClient";
import {
  formatEventDate,
  posterClass,
} from "../brand-helpers";

export default async function MisEventosPage() {
  const profile = await ensureProfile();
  const isAdmin = profile?.role === "admin";
  const db = getDb();

  const list = isAdmin
    ? await db.select().from(events).orderBy(desc(events.createdAt))
    : await db
        .select()
        .from(events)
        .where(eq(events.brandId, profile!.id))
        .orderBy(desc(events.createdAt));

  const brandIds = [...new Set(list.map((e) => e.brandId))];
  const brandRows =
    brandIds.length === 0
      ? []
      : await db
          .select({
            id: profiles.id,
            brandName: profiles.brandName,
            displayName: profiles.displayName,
          })
          .from(profiles)
          .where(inArray(profiles.id, brandIds));

  const brandMap = new Map(
    brandRows.map((b) => [
      b.id,
      b.brandName || b.displayName || "Marca",
    ])
  );

  const eventIds = list.map((e) => e.id);
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

  const stats = new Map<
    string,
    { total: number; confirmed: number; pending: number }
  >();
  for (const id of eventIds) {
    stats.set(id, { total: 0, confirmed: 0, pending: 0 });
  }
  for (const row of appRows) {
    const s = stats.get(row.eventId);
    if (!s) continue;
    s.total += 1;
    if (row.status === "approved") s.confirmed += 1;
    if (row.status === "pending") s.pending += 1;
  }

  const cards: EventCardData[] = list.map((ev) => {
    const s = stats.get(ev.id)!;
    const images = Array.isArray(ev.imageUrls) ? ev.imageUrls : [];
    return {
      id: ev.id,
      title: ev.title,
      location: ev.location,
      eventDate: ev.eventDate,
      status: ev.status,
      brandLabel:
        brandMap.get(ev.brandId) ||
        profile?.brandName ||
        profile?.displayName ||
        "Marca",
      poster: posterClass(ev.id),
      coverUrl: images[0] || null,
      dateLabel: formatEventDate(ev.eventDate),
      total: s.total,
      confirmed: s.confirmed,
      pending: s.pending,
    };
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Mis eventos</h1>
          <div className="sub">
            {isAdmin
              ? "Como admin ves todos los eventos de todas las marcas"
              : "Gestioná tus eventos y las postulaciones que recibís"}
          </div>
        </div>
        <Link href="/dashboard/eventos/nuevo" className="btn btn-solid">
          + Crear evento
        </Link>
      </div>
      <div className="content">
        <EventsListClient events={cards} />
      </div>
    </>
  );
}
