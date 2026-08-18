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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    }
  }, [isLoaded, user, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await user.updatePassword({
        newPassword: password,
        signOutOfOtherSessions: false,
      });
      router.replace(afterAuthPath(next || null));
    } catch (err) {
      setError(clerkErrorMessage(err, "No pudimos guardar la contraseña."));
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

  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    "";

  return (
    <AuthFrame
      eyebrow="Seguridad"
      title="Creá tu contraseña"
      description={
        email
          ? `Elegí una contraseña para ${email}. Así vas a poder entrar después sin Google.`
          : "Elegí una contraseña para poder entrar después a CONNECTA."
      }
    >
      <form onSubmit={onSubmit}>
        <label>
          <span className="auth-field-label">Nueva contraseña</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Mínimo 8 caracteres"
          />
        </label>
        <label style={{ display: "block", marginTop: 14 }}>
          <span className="auth-field-label">Repetir contraseña</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="auth-input"
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" disabled={busy} className="auth-primary">
          {busy ? "Guardando…" : "Guardar contraseña y continuar"}
        </button>
      </form>
      <button
        type="button"
        className="auth-secondary"
        style={{ display: "block", margin: "16px auto 0" }}
        onClick={() => router.replace(afterAuthPath(next || null))}
      >
        Continuar sin contraseña
      </button>
      <p className="auth-hint" style={{ marginTop: 16, textAlign: "center" }}>
        Si Clerk pide otra verificación, cerrá sesión y creala desde el login.{" "}
        <button
          type="button"
          className="auth-secondary"
          onClick={() => {
            const q = new URLSearchParams({
              setPassword: "1",
              email,
              next: next || "/after-auth",
            });
            void signOut({ redirectUrl: `/login?${q.toString()}` });
          }}
        >
          Preferís verificar por email
        </button>
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
