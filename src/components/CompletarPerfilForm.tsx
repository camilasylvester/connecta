"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { OnboardingForm } from "@/components/OnboardingForm";
import { syncOnboarding } from "@/app/after-auth/actions";
import type { OnboardingPayload, OnboardingRole } from "@/lib/onboarding";

export function CompletarPerfilForm({
  initialRole,
  initial,
  next = "",
}: {
  initialRole: OnboardingRole;
  initial: OnboardingPayload;
  next?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onComplete(data: OnboardingPayload) {
    setError(null);
    startTransition(async () => {
      const res = await syncOnboarding(data);
      if (!res.ok) {
        setError(res.error || "No se pudo guardar el perfil.");
        return;
      }
      const params = new URLSearchParams();
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        params.set("next", next);
      }
      const qs = params.toString();
      router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <AuthFrame
      eyebrow="Tu perfil"
      title="Completá tu ficha"
      description="Ya tenés la cuenta. Ahora contanos quién sos para que CONNECTA pueda revisarte."
      wide
    >
      {error ? <p className="auth-error">{error}</p> : null}
      {pending ? (
        <p className="auth-hint">Guardando…</p>
      ) : (
        <OnboardingForm
          initialRole={initialRole}
          initial={initial}
          lockRole
          submitLabel="Enviar solicitud"
          onComplete={onComplete}
        />
      )}
    </AuthFrame>
  );
}
