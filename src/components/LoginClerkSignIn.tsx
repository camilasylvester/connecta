"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { afterAuthPath, clerkAppearance } from "@/lib/clerk-auth";

/**
 * Prebuilt Clerk SignIn — the custom password form stays on "Cargando…"
 * when Clerk's hooks never finish (common on vercel.app / flaky mobile).
 */
export function LoginClerkSignIn({
  next = "",
  initialEmail = "",
}: {
  next?: string;
  initialEmail?: string;
}) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [waited, setWaited] = useState(false);
  const redirectUrl = afterAuthPath(next || null);
  const signUpUrl = `/login?tab=signup${next ? `&next=${encodeURIComponent(next)}` : ""}`;

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  if (isLoaded && isSignedIn) {
    return (
      <div>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Hay una sesión abierta en este navegador. Cerrala para entrar con otra
          cuenta, o continuá a la app.
        </p>
        <a href={redirectUrl} className="auth-primary" style={{ display: "block", textAlign: "center" }}>
          Continuar
        </a>
        <button
          type="button"
          className="auth-secondary"
          style={{ display: "block", margin: "12px auto 0" }}
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut({ redirectUrl: window.location.href });
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    );
  }

  if (!isLoaded && !waited) {
    return (
      <p className="auth-hint" style={{ marginTop: 0, textAlign: "center" }}>
        Cargando…
      </p>
    );
  }

  if (!isLoaded && waited) {
    return (
      <div>
        <p className="auth-error" style={{ marginTop: 0 }}>
          El login no carga en este enlace. Entrá desde{" "}
          <a
            href="https://www.connectainf.com/login"
            style={{ color: "#9c98ec", fontWeight: 700 }}
          >
            www.connectainf.com/login
          </a>
          .
        </p>
        <button
          type="button"
          className="auth-primary"
          onClick={() => {
            window.location.href = "https://www.connectainf.com/login";
          }}
        >
          Abrir login correcto
        </button>
      </div>
    );
  }

  return (
    <SignIn
      routing="hash"
      initialValues={initialEmail ? { emailAddress: initialEmail } : undefined}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      signUpUrl={signUpUrl}
      appearance={clerkAppearance}
      fallback={<p className="auth-hint">Preparando el ingreso…</p>}
    />
  );
}
