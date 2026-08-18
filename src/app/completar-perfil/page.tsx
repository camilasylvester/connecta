import { redirect } from "next/navigation";
import { CompletarPerfilForm } from "@/components/CompletarPerfilForm";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile } from "@/lib/roles";
import { profileToOnboarding } from "@/lib/onboarding";
import "../auth.css";

export default async function CompletarPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await ensureProfile();
  if (!profile) redirect("/login?next=/completar-perfil");

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.onboardingCompleted) {
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect(destinationForProfile(profile));
  }

  const initialRole = profile.role === "brand" ? "brand" : "creator";
  const initial = profileToOnboarding(profile);

  return (
    <CompletarPerfilForm
      initialRole={initialRole}
      initial={initial}
      next={next || ""}
    />
  );
}
