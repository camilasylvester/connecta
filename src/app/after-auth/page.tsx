"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AfterAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const as = searchParams.get("as") || "";

  useEffect(() => {
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    if (as) params.set("as", as);
    const qs = params.toString();
    router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
  }, [next, as, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-dark">
      Preparando tu cuenta…
    </div>
  );
}

export default function AfterAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Preparando tu cuenta…
        </div>
      }
    >
      <AfterAuthInner />
    </Suspense>
  );
}
