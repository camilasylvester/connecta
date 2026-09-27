import { redirect } from "next/navigation";
import { BrandFicha } from "@/components/BrandFicha";
import { ensureProfile } from "@/lib/auth";
import { brandFichaFromProfile } from "@/lib/brand-ficha";
import { profileToOnboarding } from "@/lib/onboarding";

export default async function ConfigPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/login?role=brand");
  if (profile.role !== "brand") {
    redirect("/mi-perfil");
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Mi perfil</h1>
          <div className="sub">La ficha que ven los creadores y el admin.</div>
        </div>
      </div>
      <div className="content">
        <BrandFicha
          brand={brandFichaFromProfile(profile)}
          audience="self"
          canEdit
          initial={profileToOnboarding(profile)}
        />
      </div>
    </>
  );
}
