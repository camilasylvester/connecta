import { redirect } from "next/navigation";
import { CompletarTelefonoForm } from "@/components/CompletarTelefonoForm";
import { ensureProfile } from "@/lib/auth";
import { profileHasValidPhone } from "@/lib/account-gate";
import { destinationForProfile } from "@/lib/roles";
import "../auth.css";

export default async function CompletarTelefonoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await ensureProfile();
  if (!profile) redirect("/login?next=/completar-telefono");

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (!profile.onboardingCompleted) {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    redirect(`/completar-perfil${qs ? `?${qs}` : ""}`);
  }

  if (profileHasValidPhone(profile)) {
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect(destinationForProfile(profile));
  }

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "";

  return (
    <CompletarTelefonoForm
      initialPhone={profile.phone || ""}
      next={safeNext}
    />
  );
}
