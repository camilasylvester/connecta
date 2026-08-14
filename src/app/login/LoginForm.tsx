"use client";

import { Suspense } from "react";
import { AuthEntry } from "@/components/AuthEntry";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <AuthEntry />
    </Suspense>
  );
}
