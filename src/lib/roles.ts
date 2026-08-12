import type { UserRole } from "@/lib/types";
import type { Profile } from "@/db/schema";

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
