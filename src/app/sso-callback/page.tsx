"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { afterAuthPath, readAuthNext, readAuthRole } from "@/lib/clerk-auth";

/** Path-based OAuth return (custom flows / future path routing). */
export default function SsoCallbackPage() {
  const [redirectUrl, setRedirectUrl] = useState(() => afterAuthPath(null));

  useEffect(() => {
    setRedirectUrl(afterAuthPath(readAuthNext() || null, readAuthRole() || null));
  }, []);

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
