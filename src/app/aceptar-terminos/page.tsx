import { redirect } from "next/navigation";
import { AceptarTerminosForm } from "@/components/AceptarTerminosForm";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile } from "@/lib/roles";
import { profileHasAcceptedTerms } from "@/lib/terms";
import "../auth.css";

export default async function AceptarTerminosPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await ensureProfile();
  if (!profile) redirect("/login?next=/aceptar-terminos");

  if (profile.role === "admin") redirect("/admin");

  if (!profile.onboardingCompleted) {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    redirect(`/completar-perfil${qs ? `?${qs}` : ""}`);
  }

  if (profileHasAcceptedTerms(profile)) {
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    redirect(destinationForProfile(profile));
  }

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "";

  return <AceptarTerminosForm next={safeNext} />;
}
