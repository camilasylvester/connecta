"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { afterAuthPath, readAuthNext, readAuthRole } from "@/lib/clerk-auth";

/**
 * Clerk SignIn/SignUp with routing="hash" send OAuth back to
 * `/current-path#/sso-callback`. AuthEntry / registro remount without the
 * Clerk component, so the built-in hash handler never runs. This catches
 * that hash on any page and finishes the Google (or other SSO) redirect.
 */
function isSsoCallbackHash(hash: string): boolean {
  return /#\/?sso-callback\b/i.test(hash);
}

export function ClerkSsoHashHandler() {
  const [active, setActive] = useState(() =>
    typeof window !== "undefined"
      ? isSsoCallbackHash(window.location.hash)
      : false
  );
  const [redirectUrl, setRedirectUrl] = useState(() =>
    typeof window !== "undefined"
      ? afterAuthPath(readAuthNext() || null, readAuthRole() || null)
      : "/after-auth"
  );

  useEffect(() => {
    const sync = () => {
      setActive(isSsoCallbackHash(window.location.hash));
      setRedirectUrl(afterAuthPath(readAuthNext() || null, readAuthRole() || null));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0d0d10] text-muted-dark"
      role="status"
      aria-live="polite"
    >
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
