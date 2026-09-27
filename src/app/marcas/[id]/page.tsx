import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { BrandFicha } from "@/components/BrandFicha";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import {
  redirectIfPasswordMissing,
  redirectIfPhoneMissing,
  redirectIfTermsMissing,
} from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { brandFichaFromProfile } from "@/lib/brand-ficha";
import { destinationForProfile } from "@/lib/roles";

export default async function MarcaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await ensureProfile();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/marcas/${id}`)}`);
  if (!viewer.onboardingCompleted) {
    redirect(`/completar-perfil?next=${encodeURIComponent(`/marcas/${id}`)}`);
  }
  redirectIfPhoneMissing(viewer);
  redirectIfTermsMissing(viewer);
  if (viewer.accountStatus === "rejected") redirect("/rechazado");
  await redirectIfPasswordMissing(`/marcas/${id}`);

  if (viewer.role === "brand" && viewer.id === id) {
    redirect("/dashboard/config");
  }
  if (viewer.role === "admin") {
    redirect(`/admin/usuarios/${id}`);
  }
  if (viewer.role !== "creator" && viewer.role !== "brand") {
    redirect(destinationForProfile(viewer));
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  const brand = rows[0];
  if (!brand || brand.role !== "brand") notFound();

  const backHref = viewer.role === "brand" ? "/dashboard" : "/eventos";

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Logo href={backHref} />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href={backHref} className="font-semibold text-purple-2 hover:text-white">
              Volver
            </Link>
            <LogoutButton className="text-muted-dark hover:text-white" />
          </div>
        </div>
        <BrandFicha
          brand={brandFichaFromProfile(brand)}
          audience="creator"
          canEdit={false}
        />
      </div>
    </div>
  );
}
