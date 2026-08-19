import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { getDb } from "@/db";
import { applications, events } from "@/db/schema";
import { redirectIfNotApproved, redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile } from "@/lib/roles";

export default async function MisPostulacionesPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/login?role=creator");
  if (!profile.onboardingCompleted || profile.accountStatus === "rejected") {
    redirectIfNotApproved(profile);
  }
  await redirectIfPasswordMissing("/mis-postulaciones");
  if (profile.role !== "creator" && profile.role !== "admin") {
    redirect(destinationForProfile(profile));
  }

  const db = getDb();
  const list =
    profile.role === "admin"
      ? await db
          .select({
            id: applications.id,
            status: applications.status,
            title: events.title,
            location: events.location,
            category: events.category,
            inviteToken: events.inviteToken,
          })
          .from(applications)
          .leftJoin(events, eq(applications.eventId, events.id))
          .orderBy(desc(applications.createdAt))
      : await db
          .select({
            id: applications.id,
            status: applications.status,
            title: events.title,
            location: events.location,
            category: events.category,
            inviteToken: events.inviteToken,
          })
          .from(applications)
          .leftJoin(events, eq(applications.eventId, events.id))
          .where(eq(applications.creatorId, profile.id))
          .orderBy(desc(applications.createdAt));

  const statusLabel = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  } as const;

  const statusClass = {
    pending: "bg-amber-500/15 text-amber-300",
    approved: "bg-ok/15 text-ok",
    rejected: "bg-danger/15 text-danger",
  } as const;

  return (
    <div className="min-h-screen bg-ink px-6 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between">
          <Logo
            href={
              profile.role === "admin" ? "/admin" : "/eventos"
            }
          />
          <div className="flex items-center gap-4">
            <Link
              href="/mi-perfil"
              className="text-sm font-semibold text-purple-2 hover:text-white"
            >
              Mi perfil
            </Link>
            <Link
              href="/eventos"
              className="text-sm font-semibold text-purple-2 hover:text-white"
            >
              ← Ver eventos
            </Link>
            <LogoutButton className="text-sm text-muted-dark hover:text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold">
          {profile.role === "admin"
            ? "Postulaciones (vista influencer)"
            : "Mis postulaciones"}
        </h1>
        <p className="mt-2 text-sm text-muted-dark">
          Hola {profile.handle || profile.displayName || ""} — acá ves el
          estado de cada postulación.
        </p>

        <div className="mt-8 space-y-3">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-muted-dark">
              Todavía no hay postulaciones. Cuando te manden un link privado,
              abrilo desde el celular.
            </div>
          ) : (
            list.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-white/10 bg-ink-2 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      {app.title || "Evento"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-dark">
                      {[app.location, app.category].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[app.status]}`}
                  >
                    {statusLabel[app.status]}
                  </span>
                </div>
                {app.inviteToken && (
                  <Link
                    href={`/aplicar/${app.inviteToken}`}
                    className="mt-4 inline-block text-sm font-semibold text-purple-2"
                  >
                    Ver evento →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
