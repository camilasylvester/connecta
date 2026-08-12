import { redirect } from "next/navigation";
import { ProfileEditClient } from "@/components/ProfileEditClient";
import { ensureProfile } from "@/lib/auth";
import { profileToOnboarding } from "@/lib/onboarding";

export default async function ConfigPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/login?role=brand");
  if (profile.role !== "brand" && profile.role !== "admin") {
    redirect("/mi-perfil");
  }

  // Admin opening brand config: if they don't have brand fields, still allow edit of their profile as brand-shaped only when role is brand
  if (profile.role === "admin") {
    redirect("/mi-perfil");
  }

  const initial = profileToOnboarding(profile);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Mi perfil</h1>
          <div className="sub">
            Editá la ficha de tu marca. Los creadores y el admin ven esta info.
          </div>
        </div>
      </div>
      <div className="content">
        <div className="config-card" style={{ maxWidth: 720 }}>
          <ProfileEditClient initial={initial} />
        </div>
      </div>
    </>
  );
}
