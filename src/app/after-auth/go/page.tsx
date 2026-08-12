import { redirect } from "next/navigation";
import { redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile } from "@/lib/roles";

/** Server hop after client Instagram sync. */
export default async function AfterAuthGoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  let profile = null;
  try {
    profile = await ensureProfile();
  } catch (err) {
    console.error("after-auth ensureProfile failed", err);
    redirect("/login?error=profile");
  }

  if (!profile) redirect("/login");

  await redirectIfPasswordMissing(
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined
  );

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

  if (
    profile.accountStatus === "pending" ||
    profile.accountStatus === "rejected"
  ) {
    redirect(destinationForProfile(profile));
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }

  redirect(destinationForProfile(profile));
}
