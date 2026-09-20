"use client";

import { useState } from "react";
import { syncPhone } from "@/app/after-auth/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { LogoutButton } from "@/components/LogoutButton";

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
      eyebrow="Un dato más"
      title="Agregá tu celular"
      description="Para seguir usando CONNECTA necesitamos un celular argentino. Lo usamos para linkear WhatsApp en tu perfil."
    >
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <label className="auth-field">
          <span className="auth-field-label">Celular (WhatsApp) *</span>
          <input
            id="phone"
            className="auth-input"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 11 1234-5678"
            autoComplete="tel"
            required
            autoFocus
            disabled={busy}
          />
        </label>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Solo celular argentino, por ejemplo 11 1234-5678 o +54 9 11 1234-5678.
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
