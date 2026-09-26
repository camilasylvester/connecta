"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { RegistroCreadorV3Form } from "@/components/RegistroCreadorV3Form";
import { RegistroMarcaForm } from "@/components/RegistroMarcaForm";
import { syncOnboarding, syncTermsAcceptance } from "@/app/after-auth/actions";
import {
  clearCreatorDraft,
  loadCreatorDraft,
  profileToCreatorDraft,
  v3DraftToOnboarding,
  type CreatorRegistroV3Draft,
} from "@/lib/creator-registro-v3";
import type { OnboardingPayload, OnboardingRole } from "@/lib/onboarding";
import { clearBrandDraft, loadBrandDraft } from "@/lib/signup-draft";

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
  const [, startTransition] = useTransition();
  const [syncingDraft, setSyncingDraft] = useState(true);

  // Alta "perfil primero" (T-36): la ficha se lleno antes de crear la cuenta y
  // quedo como borrador local. Apenas existe la cuenta la subimos una sola vez.
  // El trabajo vive dentro de la transicion async, asi que el effect no hace
  // setState sincronico (el estado arranca en true y solo se apaga al terminar).
  // Los terminos NO se aceptan aca: llegan por la metadata de Clerk del alta;
  // si faltaran, el gate /aceptar-terminos los pide de forma explicita.
  const syncStartedRef = useRef(false);
  useEffect(() => {
    if (syncStartedRef.current) return;
    syncStartedRef.current = true;

    startTransition(async () => {
      let payload: OnboardingPayload | null = null;
      if (initialRole === "creator") {
        const draft = loadCreatorDraft();
        if (draft) {
          const merged: CreatorRegistroV3Draft = {
            ...draft,
            instagram: draft.instagram || initial.instagram,
            nombre: draft.nombre || initial.fullName,
            phone: draft.phone || initial.phone,
          };
          payload = v3DraftToOnboarding(merged);
        }
      } else {
        const draft = loadBrandDraft();
        if (draft) {
          payload = {
            ...draft,
            role: "brand",
            // Si la persona no cargo otro, el email de contacto es el de la cuenta.
            contactEmail: draft.contactEmail || initial.contactEmail,
          };
        }
      }

      if (!payload) {
        setSyncingDraft(false);
        return;
      }

      const res = await syncOnboarding(payload);
      if (!res.ok) {
        setError(res.error || "No se pudo guardar el perfil.");
        setSyncingDraft(false);
        return;
      }
      clearCreatorDraft();
      clearBrandDraft();
      const params = new URLSearchParams();
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        params.set("next", next);
      }
      const qs = params.toString();
      router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
    });
  }, [
    initialRole,
    initial.instagram,
    initial.fullName,
    initial.phone,
    initial.contactEmail,
    next,
    router,
  ]);

  function goAfterAuth() {
    const params = new URLSearchParams();
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      params.set("next", next);
    }
    const qs = params.toString();
    router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
  }

  function onComplete(data: OnboardingPayload) {
    setError(null);
    startTransition(async () => {
      const termsRes = await syncTermsAcceptance();
      if (!termsRes.ok) {
        setError(termsRes.error || "No se pudo guardar la aceptación.");
        return;
      }
      const res = await syncOnboarding(data);
      if (!res.ok) {
        setError(res.error || "No se pudo guardar el perfil.");
        return;
      }
      clearBrandDraft();
      goAfterAuth();
    });
  }

  if (syncingDraft) {
    return (
      <AuthFrame
        eyebrow="Tu perfil"
        title="Guardando tu ficha"
        description="Estamos guardando los datos que completaste en el registro."
      >
        <p className="auth-hint">Un momento…</p>
        {error ? <p className="auth-error">{error}</p> : null}
      </AuthFrame>
    );
  }

  if (initialRole === "creator") {
    return (
      <>
        {error ? (
          <p className="auth-error" style={{ padding: "16px 32px 0", textAlign: "center" }}>
            {error}
          </p>
        ) : null}
        <RegistroCreadorV3Form
          initialInstagram={initial.instagram}
          initialDraft={profileToCreatorDraft(initial)}
          next={next}
          variant="profile"
          onComplete={async (draft) => {
            setError(null);
            startTransition(async () => {
              const merged: CreatorRegistroV3Draft = {
                ...draft,
                instagram: draft.instagram || initial.instagram,
                nombre: draft.nombre || initial.fullName,
                phone: draft.phone || initial.phone,
              };
              const res = await syncOnboarding(v3DraftToOnboarding(merged));
              if (!res.ok) {
                setError(res.error || "No se pudo guardar el perfil.");
                return;
              }
              clearCreatorDraft();
              goAfterAuth();
            });
          }}
        />
      </>
    );
  }

  // Marca con cuenta pero sin ficha (se perdio el borrador del alta, o cuentas
  // viejas): mismo wizard por etapas que en el alta, arrancando con lo que hay.
  return (
    <>
      {error ? (
        <p className="auth-error" style={{ padding: "16px 32px 0", textAlign: "center" }}>
          {error}
        </p>
      ) : null}
      <RegistroMarcaForm
        variant="profile"
        initial={{ ...initial, role: "brand" }}
        onComplete={onComplete}
      />
    </>
  );
}
