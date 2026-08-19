"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { afterAuthPath, readAuthNext } from "@/lib/clerk-auth";

export default function SsoCallbackPage() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    setRedirectUrl(afterAuthPath(readAuthNext() || null));
  }, []);

  if (!redirectUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-dark">
        <p className="text-sm">Conectando tu cuenta…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-dark">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={redirectUrl}
        signUpFallbackRedirectUrl={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      />
      <p className="mt-2 text-sm text-muted-dark">Conectando tu cuenta…</p>
    </div>
  );
}
