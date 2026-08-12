import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/db/schema";

/** Redirect pending/rejected non-admins to status pages. */
export function redirectIfNotApproved(profile: Profile): void {
  if (profile.role === "admin") return;
  if (!profile.onboardingCompleted) redirect("/completar-perfil");
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
