"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { afterAuthPath } from "@/lib/clerk-auth";

const appearance = {
  variables: {
    colorPrimary: "#6f6ae0",
    colorBackground: "#0d0d10",
    colorInputBackground: "#0a0a0c",
    colorInputText: "#f4f3ef",
    colorText: "#f4f3ef",
    colorTextSecondary: "rgba(244, 243, 239, 0.56)",
    colorDanger: "#f87171",
    borderRadius: "8px",
    fontFamily: "var(--font-inter), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none border-0 p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "border border-[rgba(244,243,239,0.14)] bg-[#0d0d10] text-[#f4f3ef] hover:bg-white/5",
    formButtonPrimary:
      "bg-[#6f6ae0] hover:bg-[#9c98ec] text-white shadow-none",
    formFieldInput:
      "border border-[rgba(244,243,239,0.14)] bg-[#0a0a0c] text-[#f4f3ef]",
    footerActionLink: "text-[#9c98ec] hover:text-white",
    identityPreviewEditButton: "text-[#9c98ec]",
    formFieldLabel: "text-[rgba(244,243,239,0.56)]",
    dividerLine: "bg-[rgba(244,243,239,0.14)]",
    dividerText: "text-[rgba(244,243,239,0.56)]",
  },
} as const;

/**
 * Prebuilt Clerk SignUp — handles Turnstile/captcha correctly (custom
 * password flow was hanging / failing bot checks for some users).
 */
export function RegistroClerkSignUp({
  role,
  next = "",
}: {
  role: "brand" | "creator";
  next?: string;
}) {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const redirectUrl = afterAuthPath(next || null);
  const signInUrl = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

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
      unsafeMetadata={{ role }}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
      signInUrl={signInUrl}
      appearance={appearance}
      fallback={<p className="auth-hint">Preparando el registro…</p>}
    />
  );
}
