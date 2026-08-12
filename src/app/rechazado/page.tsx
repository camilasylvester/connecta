import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { ensureProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RechazadoPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");
  if (profile.accountStatus === "approved") {
    redirect(profile.role === "brand" ? "/dashboard" : "/eventos");
  }
  if (profile.accountStatus === "pending") redirect("/pendiente");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6">
      <div className="w-full max-w-md text-center">
        <Logo href="/" className="mb-10 justify-center text-2xl" />
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-danger">
          Cuenta no aprobada
        </p>
        <h1 className="text-3xl font-extrabold tracking-[-0.025em]">
          No pudimos aprobar tu cuenta
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-dark">
          Por ahora no pudimos aprobar tu cuenta. Si creés que es un error,
          escribinos.
        </p>
        <div className="mt-10">
          <LogoutButton className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold hover:border-purple-2" />
        </div>
      </div>
    </div>
  );
}
