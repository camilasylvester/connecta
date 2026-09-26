"use client";

import { useState } from "react";
import { syncPhone } from "@/app/after-auth/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { LogoutButton } from "@/components/LogoutButton";
import { PhoneInput } from "@/components/PhoneInput";

function afterAuthHref(next: string) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `/after-auth/go${qs ? `?${qs}` : ""}`;
}

export function CompletarTelefonoForm({
  initialPhone,
  next,
}: {
  initialPhone: string;
  next: string;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await syncPhone(phone);
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
      title="Agregá tu celular"
      description="Para seguir usando Connecta necesitamos tu celular. Lo usamos para WhatsApp en tu perfil."
      showMobileTitle
    >
      <p className="auth-wizard-foot" style={{ marginTop: 0, marginBottom: 18 }}>
        Un paso más para activar tu cuenta.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label className="auth-field">
          <span className="auth-field-label">Celular (WhatsApp) *</span>
          <PhoneInput
            id="phone"
            inputClassName="auth-input"
            value={phone}
            onChange={setPhone}
            required
            autoFocus
            disabled={busy}
          />
        </label>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Celular de Argentina, Uruguay, Chile o España. Elegí el prefijo de tu país.
        </p>
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
