"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { OnboardingForm } from "@/components/OnboardingForm";
import { RegistroCreadorV3Form } from "@/components/RegistroCreadorV3Form";
import { syncOnboarding } from "@/app/after-auth/actions";
import {
  clearCreatorDraft,
  loadCreatorDraft,
  v3DraftToOnboarding,
} from "@/lib/creator-registro-v3";
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
  const [syncingDraft, setSyncingDraft] = useState(initialRole === "creator");

  useEffect(() => {
    if (initialRole !== "creator") {
      setSyncingDraft(false);
      return;
    }
    const draft = loadCreatorDraft();
    if (!draft) {
      setSyncingDraft(false);
      return;
    }

    startTransition(async () => {
      const res = await syncOnboarding(v3DraftToOnboarding(draft));
      clearCreatorDraft();
      if (!res.ok) {
        setError(res.error || "No se pudo guardar el perfil.");
        setSyncingDraft(false);
        return;
      }
      const params = new URLSearchParams();
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        params.set("next", next);
      }
      const qs = params.toString();
      router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
    });
  }, [initialRole, next, router]);

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

  if (syncingDraft || pending) {
    return (
      <AuthFrame
        eyebrow="Tu perfil"
        title="Guardando tu ficha"
        description="Estamos guardando los datos que completaste en el registro."
      >
        <p className="auth-hint">Un momento…</p>
      </AuthFrame>
    );
  }

  if (initialRole === "creator") {
    return (
      <RegistroCreadorV3Form
        initialInstagram={initial.instagram}
        next={next}
        variant="profile"
        onComplete={async (draft) => {
          setError(null);
          startTransition(async () => {
            const res = await syncOnboarding(v3DraftToOnboarding(draft));
            clearCreatorDraft();
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
        }}
      />
    );
  }

  return (
    <AuthFrame
      eyebrow="Tu perfil"
      title="Completá tu ficha"
      description="Ya tenés la cuenta. Ahora contanos quién sos para que CONNECTA pueda revisarte."
      wide
    >
      {error ? <p className="auth-error">{error}</p> : null}
      <OnboardingForm
        initialRole={initialRole}
        initial={initial}
        lockRole
        submitLabel="Enviar solicitud"
        onComplete={onComplete}
      />
    </AuthFrame>
  );
}
