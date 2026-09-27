import type { UserRole } from "@/lib/types";
import type { Profile } from "@/db/schema";
import {
  profileHasValidPhone,
} from "@/lib/account-gate";
import { profileHasAcceptedTerms } from "@/lib/terms";

/** Ruta interna que se puede usar como `next`, sin abrir otro sitio. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Pantallas que el admin puede mirar como las ve un influencer. */
export function isInfluencerPreviewPath(path: string): boolean {
  return (
    path.startsWith("/aplicar/") ||
    path === "/eventos" ||
    path.startsWith("/eventos?") ||
    path.startsWith("/marcas/") ||
    path === "/mis-postulaciones" ||
    path.startsWith("/mis-postulaciones?") ||
    path === "/mi-perfil" ||
    path.startsWith("/mi-perfil?")
  );
}

export function homeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "brand":
      return "/dashboard";
    case "creator":
    default:
      return "/eventos";
  }
}

/** Post-auth destination considering approval status. */
export function destinationForProfile(profile: Profile): string {
  if (profile.role === "admin") return "/admin";
  if (!profile.onboardingCompleted) return "/completar-perfil";
  if (!profileHasValidPhone(profile)) return "/completar-telefono";
  if (!profileHasAcceptedTerms(profile)) return "/aceptar-terminos";
  if (profile.accountStatus === "pending") return "/pendiente";
  if (profile.accountStatus === "rejected") return "/rechazado";
  return homeForRole(profile.role);
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "brand":
      return "Marca";
    case "creator":
      return "Influencer";
  }
}
