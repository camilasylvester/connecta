import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { updateEvent } from "@/app/actions";
import { AdminApproveEventButton } from "@/components/AdminApproveEventButton";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { EventDetailTabs } from "@/components/EventDetailTabs";
import { getDb } from "@/db";
import { applications, events, profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";
import type { ApplicationWithCreator } from "@/lib/types";
import {
  formatEventDate,
  statusMeta,
} from "@/app/dashboard/brand-helpers";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const profile = await ensureProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";
  const db = getDb();
  const rows = isAdmin
    ? await db.select().from(events).where(eq(events.id, id)).limit(1)
    : await db
        .select()
        .from(events)
        .where(and(eq(events.id, id), eq(events.brandId, profile.id)))
        .limit(1);

  const ev = rows[0];
  if (!ev) notFound();

  const [brand] = await db
    .select({
      brandName: profiles.brandName,
      displayName: profiles.displayName,
    })
    .from(profiles)
    .where(eq(profiles.id, ev.brandId))
    .limit(1);

  const brandLabel =
    brand?.brandName ||
    brand?.displayName ||
    profile.brandName ||
    profile.displayName ||
    "Marca";

  const appRows = await db
    .select({
      id: applications.id,
      eventId: applications.eventId,
      creatorId: applications.creatorId,
      status: applications.status,
      message: applications.message,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      displayName: profiles.displayName,
      handle: profiles.handle,
      category: profiles.category,
      followers: profiles.followers,
      city: profiles.city,
    })
    .from(applications)
    .leftJoin(profiles, eq(applications.creatorId, profiles.id))
    .where(eq(applications.eventId, id))
    .orderBy(desc(applications.createdAt));

  const apps: ApplicationWithCreator[] = appRows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    creatorId: r.creatorId,
    status: r.status,
    message: r.message,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    profiles: {
      displayName: r.displayName,
      handle: r.handle,
      category: r.category,
      followers: r.followers,
      city: r.city,
    },
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const inviteUrl = `${siteUrl}/aplicar/${ev.inviteToken}`;
  const meta = statusMeta(ev.status);
  const initialTab =
    tab === "evento" || (isAdmin && tab !== "solicitudes")
      ? "evento"
      : "solicitudes";
  const backHref = isAdmin ? "/admin/eventos" : "/dashboard/eventos";
  const backLabel = isAdmin ? "← Todos los eventos" : "← Mis eventos";

  async function save(formData: FormData) {
    "use server";
    await updateEvent(id, formData);
  }

  async function closeApps() {
    "use server";
    const data = new FormData();
    data.set("title", ev.title);
    data.set("description", ev.description || "");
    data.set("location", ev.location || "");
    data.set("event_date", ev.eventDate || "");
    data.set("quota", String(ev.quota));
    data.set("category", ev.category || "");
    data.set("profile_sought", ev.profileSought || "");
    data.set("status", "closed");
    await updateEvent(id, data);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <Link href={backHref} className="back-link">
            {backLabel}
          </Link>
          <div className="detail-header" style={{ marginBottom: 0 }}>
            <div>
              <h1>{ev.title}</h1>
              <div className="meta">
                {isAdmin ? (
                  <>
                    <span className="status-badge status-wait">
                      Vista admin
                    </span>
                    {" · "}
                  </>
                ) : null}
                {brandLabel}
                {ev.location ? ` · ${ev.location}` : ""}
                {ev.eventDate ? ` · ${formatEventDate(ev.eventDate)}` : ""}
                {" · "}
                <span
                  className={`status-badge ${meta.className}`}
                  style={{ verticalAlign: "middle" }}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="detail-actions">
          {isAdmin && ev.status === "draft" ? (
            <AdminApproveEventButton eventId={ev.id} title={ev.title} />
          ) : null}
          {ev.status === "active" && (
            <form action={closeApps}>
              <button type="submit" className="btn btn-outline btn-sm">
                Cerrar postulaciones
              </button>
            </form>
          )}
          <DeleteEventButton eventId={ev.id} title={ev.title} />
        </div>
      </div>

      <div className="content">
        <EventDetailTabs
          event={ev}
          brandLabel={brandLabel}
          applications={apps}
          inviteUrl={inviteUrl}
          saveAction={save}
          closeAction={closeApps}
          initialTab={initialTab}
          canPublish={isAdmin}
        />
      </div>
    </>
  );
}
