"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncPhone } from "@/app/after-auth/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { LogoutButton } from "@/components/LogoutButton";

export function CompletarTelefonoForm({
  initialPhone,
  next,
}: {
  initialPhone: string;
  next: string;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await syncPhone(phone);
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
          />
        </label>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Solo celular argentino, por ejemplo 11 1234-5678 o +54 9 11 1234-5678.
        </p>
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
