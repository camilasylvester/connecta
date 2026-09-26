"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { afterAuthPath, readAuthNext, readAuthRole } from "@/lib/clerk-auth";

/** Path-based OAuth return (custom flows / future path routing). */
export default function SsoCallbackPage() {
  // readAuthNext/readAuthRole devuelven "" en servidor, asi que en SSR esto
  // rinde el mismo "/after-auth" que antes daba el estado inicial.
  const redirectUrl = afterAuthPath(
    readAuthNext() || null,
    readAuthRole() || null
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-muted-dark">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={redirectUrl}
        signUpFallbackRedirectUrl={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      />
      <p className="mt-2 text-sm">Conectando tu cuenta…</p>
    </div>
  );
}
