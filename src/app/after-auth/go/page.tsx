import { redirect } from "next/navigation";
import {
  profileHasValidPhone,
  redirectIfPasswordMissing,
} from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { roleFromAsParam } from "@/lib/clerk-auth";
import { destinationForProfile } from "@/lib/roles";
import { profileHasAcceptedTerms } from "@/lib/terms";

function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

/** Server hop after client auth sync. */
export default async function AfterAuthGoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; as?: string }>;
}) {
  const { next, as } = await searchParams;

  let profile = null;
  try {
    profile = await ensureProfile();
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("after-auth ensureProfile failed", err);
    redirect("/login?error=profile");
  }

  if (!profile) redirect("/login");

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const intended = roleFromAsParam(as || null);
  if (
    intended &&
    (profile.role === "creator" || profile.role === "brand") &&
    profile.role !== intended
  ) {
    const params = new URLSearchParams();
    params.set("error", "role_mismatch");
    params.set(
      "expected",
      profile.role === "brand" ? "marca" : "creador"
    );
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    redirect(`/login?${params.toString()}`);
  }

  if (!profile.onboardingCompleted) {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    redirect(`/completar-perfil${qs ? `?${qs}` : ""}`);
  }

  if (!profileHasValidPhone(profile)) {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    redirect(`/completar-telefono${qs ? `?${qs}` : ""}`);
  }

  if (!profileHasAcceptedTerms(profile)) {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    redirect(`/aceptar-terminos${qs ? `?${qs}` : ""}`);
  }

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const pendingCreatorMayContinue =
    profile.role === "creator" &&
    profile.accountStatus === "pending" &&
    Boolean(
      safeNext &&
        (safeNext.startsWith("/aplicar/") ||
          safeNext === "/eventos" ||
          safeNext.startsWith("/eventos?") ||
          safeNext === "/mis-postulaciones" ||
          safeNext.startsWith("/mis-postulaciones?"))
    );

  if (profile.accountStatus === "rejected") {
    redirect(destinationForProfile(profile));
  }

  if (profile.accountStatus === "pending" && !pendingCreatorMayContinue) {
    redirect(destinationForProfile(profile));
  }

  await redirectIfPasswordMissing(safeNext);

  if (safeNext) {
    redirect(safeNext);
  }

  redirect(destinationForProfile(profile));
}
