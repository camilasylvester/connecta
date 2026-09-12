import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/db/schema";
import { isValidArMobile } from "@/lib/phone";
import { profileHasAcceptedTerms } from "@/lib/terms";

export function profileHasValidPhone(profile: Profile): boolean {
  return isValidArMobile(profile.phone || "");
}

/**
 * Usuarios con onboarding hecho pero sin celular AR válido
 * no pueden usar la app hasta cargarlo.
 */
export function redirectIfPhoneMissing(profile: Profile): void {
  if (profile.role === "admin") return;
  if (!profile.onboardingCompleted) return;
  if (!profileHasValidPhone(profile)) redirect("/completar-telefono");
}

/** Sin aceptación de términos/privacidad no pueden usar la app. */
export function redirectIfTermsMissing(profile: Profile): void {
  if (profile.role === "admin") return;
  if (!profile.onboardingCompleted) return;
  if (!profileHasAcceptedTerms(profile)) redirect("/aceptar-terminos");
}

/** Redirect pending/rejected non-admins to status pages. */
export function redirectIfNotApproved(profile: Profile): void {
  if (profile.role === "admin") return;
  if (!profile.onboardingCompleted) redirect("/completar-perfil");
  redirectIfPhoneMissing(profile);
  redirectIfTermsMissing(profile);
  if (profile.accountStatus === "pending") redirect("/pendiente");
  if (profile.accountStatus === "rejected") redirect("/rechazado");
}

/** Force users without a password to create one before using the app. */
export async function redirectIfPasswordMissing(
  nextPath?: string
): Promise<void> {
  const user = await currentUser();
  if (!user) return;
  if (user.passwordEnabled) return;
  const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  redirect(`/crear-contrasena${next}`);
}
