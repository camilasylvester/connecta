"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AfterAuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";

  useEffect(() => {
    const params = next ? `?next=${encodeURIComponent(next)}` : "";
    router.replace(`/after-auth/go${params}`);
  }, [next, router]);

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
