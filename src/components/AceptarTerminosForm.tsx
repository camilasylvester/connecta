"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncTermsAcceptance } from "@/app/after-auth/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { LogoutButton } from "@/components/LogoutButton";
import { TermsAcceptCheckbox } from "@/components/TermsAcceptCheckbox";

export function AceptarTerminosForm({ next }: { next: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Tenés que aceptar los Términos y la Política de privacidad.");
      return;
    }
    startTransition(async () => {
      const res = await syncTermsAcceptance();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const params = new URLSearchParams();
      if (next) params.set("next", next);
      const qs = params.toString();
      router.replace(`/after-auth/go${qs ? `?${qs}` : ""}`);
      router.refresh();
    });
  }

  return (
    <AuthFrame
      eyebrow="Legal"
      title="Aceptá los términos"
      description="Para seguir usando CONNECTA necesitamos tu aceptación de los Términos y la Política de privacidad."
    >
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <TermsAcceptCheckbox checked={accepted} onChange={setAccepted} />
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="auth-primary" disabled={pending}>
          {pending ? "Guardando…" : "Continuar"}
        </button>
      </form>
      <p className="auth-switch">
        <LogoutButton />
      </p>
    </AuthFrame>
  );
}
