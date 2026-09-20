"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  afterAuthPath,
  clerkAppearance,
  persistAuthNext,
  persistAuthRole,
  type AuthProfileRole,
} from "@/lib/clerk-auth";

/**
 * Prebuilt Clerk SignUp — Google + email. Profile data comes after.
 */
export function RegistroClerkSignUp({
  role,
  next = "",
  extraMetadata,
  initialEmail,
}: {
  role: AuthProfileRole;
  next?: string;
  extraMetadata?: Record<string, string>;
  initialEmail?: string;
}) {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const redirectUrl = afterAuthPath(next || null, role);
  const signInUrl = `/login?tab=login&as=${role === "brand" ? "marca" : "creador"}${
    next ? `&next=${encodeURIComponent(next)}` : ""
  }`;

  useEffect(() => {
    persistAuthNext(next);
    persistAuthRole(role);
  }, [next, role]);

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
      signInForceRedirectUrl={redirectUrl}
      signInFallbackRedirectUrl={redirectUrl}
      signInUrl={signInUrl}
      appearance={clerkAppearance}
      fallback={<p className="auth-hint">Preparando el registro…</p>}
    />
  );
}
