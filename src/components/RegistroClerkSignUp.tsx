"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { afterAuthPath, clerkAppearance, persistAuthNext } from "@/lib/clerk-auth";

/**
 * Prebuilt Clerk SignUp — handles Turnstile/captcha correctly (custom
 * password flow was hanging / failing bot checks for some users).
 */
export function RegistroClerkSignUp({
  role,
  next = "",
  extraMetadata,
  initialEmail,
}: {
  role: "brand" | "creator";
  next?: string;
  extraMetadata?: Record<string, string>;
  initialEmail?: string;
}) {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const redirectUrl = afterAuthPath(next || null);
  const signInUrl = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  useEffect(() => {
    persistAuthNext(next);
  }, [next]);

  if (!isLoaded) {
    return <p className="auth-hint">Preparando el registro…</p>;
  }

  if (isSignedIn) {
    return (
      <div>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Hay una sesión abierta en este navegador. Cerrala para crear una
          cuenta nueva.
        </p>
        <button
          type="button"
          className="auth-primary"
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
          {signingOut ? "Cerrando…" : "Cerrar sesión y continuar"}
        </button>
      </div>
    );
  }

  return (
    <SignUp
      routing="hash"
      unsafeMetadata={{ role, ...extraMetadata }}
      initialValues={initialEmail ? { emailAddress: initialEmail } : undefined}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      signInUrl={signInUrl}
      appearance={clerkAppearance}
      fallback={<p className="auth-hint">Preparando el registro…</p>}
    />
  );
}
