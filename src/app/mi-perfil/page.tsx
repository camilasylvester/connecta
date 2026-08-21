import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { CreatorSocialProfile } from "@/components/CreatorSocialProfile";
import { redirectIfNotApproved, redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { profileToOnboarding } from "@/lib/onboarding";
import { destinationForProfile } from "@/lib/roles";
import { isTikTokConfigured } from "@/lib/tiktok";
import { getDb } from "@/db";
import { creatorPosts } from "@/db/schema";

export default async function MiPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tiktok?: string }>;
}) {
  const profile = await ensureProfile();
  if (!profile) redirect("/login");
  redirectIfNotApproved(profile);
  await redirectIfPasswordMissing("/mi-perfil");

  if (profile.role === "brand") {
    redirect("/dashboard/config");
  }
  if (profile.role !== "creator" && profile.role !== "admin") {
    redirect(destinationForProfile(profile));
  }

  const params = await searchParams;
  const tiktokFlash =
    params.tiktok === "connected" || params.tiktok === "error"
      ? params.tiktok
      : null;

  const db = getDb();
  const posts = await db
    .select()
    .from(creatorPosts)
    .where(eq(creatorPosts.creatorId, profile.id))
    .orderBy(desc(creatorPosts.createdAt));

  const initial = profileToOnboarding(profile);
  const tiktokConnected = Boolean(
    profile.tiktokAccessToken || profile.tiktokRefreshToken
  );

  return (
    <div className="min-h-screen bg-ink px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Logo href={profile.role === "admin" ? "/admin" : "/eventos"} />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/eventos"
              className="font-semibold text-purple-2 hover:text-white"
            >
              Eventos
            </Link>
            <Link
              href="/mis-postulaciones"
              className="font-semibold text-purple-2 hover:text-white"
            >
              Mis postulaciones
            </Link>
            <LogoutButton className="text-muted-dark hover:text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-2 p-5 sm:p-8">
          <CreatorSocialProfile
            initial={initial}
            posts={posts}
            tiktokConnected={tiktokConnected}
            tiktokConfigured={isTikTokConfigured()}
            tiktokFlash={tiktokFlash}
          />
        </div>
      </div>
    </div>
  );
}
