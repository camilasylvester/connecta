"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { afterAuthPath, clerkErrorMessage } from "@/lib/clerk-auth";
import "../auth.css";

function CrearContrasenaInner() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      const q = new URLSearchParams({
        setPassword: "1",
        next: next || "/after-auth",
      });
      router.replace(`/login?${q.toString()}`);
      return;
    }
    if (user.passwordEnabled) {
      router.replace(afterAuthPath(next || null));
      return;
    }
    const fromClerk =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    if (fromClerk) setEmail(fromClerk);
  }, [isLoaded, user, router, next]);

  async function startEmailFlow(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Escribí tu email. Ahí te mandamos el código.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        setPassword: "1",
        email: trimmed,
        next: next || "/after-auth",
      });
      await signOut({ redirectUrl: `/login?${q.toString()}` });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setBusy(false);
    }
  }

  if (!isLoaded || !user || user.passwordEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-dark">
        Preparando…
      </div>
    );
  }

  return (
    <AuthFrame
      eyebrow="Seguridad"
      title="Creá tu contraseña"
      description="Tenés que crear una contraseña para poder entrar. Primero tu email: te mandamos un código."
    >
      <form onSubmit={startEmailFlow}>
        <label>
          <span className="auth-field-label">Tu email</span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="vos@email.com"
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={busy || !email.trim()} className="auth-primary">
          {busy ? "Continuando…" : "Enviar código a este email"}
        </button>
      </form>
      <p className="auth-hint" style={{ marginTop: 16, textAlign: "center" }}>
        Usá el mismo email con el que te registraste en CONNECTA.
      </p>
    </AuthFrame>
  );
}

export default function CrearContrasenaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <CrearContrasenaInner />
    </Suspense>
  );
}
