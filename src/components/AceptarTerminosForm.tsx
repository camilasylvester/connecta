"use client";

import { useState } from "react";
import { syncTermsAcceptance } from "@/app/after-auth/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { LogoutButton } from "@/components/LogoutButton";
import { TermsAcceptCheckbox } from "@/components/TermsAcceptCheckbox";

function afterAuthHref(next: string) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `/after-auth/go${qs ? `?${qs}` : ""}`;
}

export function AceptarTerminosForm({ next }: { next: string }) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!accepted) {
      setError("Tenés que aceptar los Términos y la Política de privacidad.");
      return;
    }
    setBusy(true);
    try {
      const res = await syncTermsAcceptance();
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      // Full navigation so gates re-read the DB; soft nav + refresh was hanging
      // the button on "Guardando…" even after a successful save.
      window.location.assign(afterAuthHref(next));
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      eyebrow=""
      title="Aceptá los términos"
      description="Para seguir usando Connecta necesitamos tu aceptación de los Términos y la Política de privacidad."
      showMobileTitle
    >
      <p className="auth-wizard-foot" style={{ marginTop: 0, marginBottom: 18 }}>
        Último paso antes de entrar.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <TermsAcceptCheckbox checked={accepted} onChange={setAccepted} />
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="auth-primary" disabled={busy}>
          {busy ? "Guardando…" : "Continuar"}
        </button>
      </form>
      <p className="auth-switch">
        <LogoutButton />
      </p>
    </AuthFrame>
  );
}
