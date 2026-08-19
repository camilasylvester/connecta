"use client";

import { useState } from "react";
import { applyToEvent } from "@/app/actions";
import { InstagramHandleInput } from "@/components/InstagramHandleInput";
import type { Profile } from "@/lib/types";

export function ApplyForm({
  eventId,
  profile,
}: {
  eventId: string;
  profile: Profile | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    setSending(true);
    try {
      await applyToEvent(eventId, formData);
    } catch (err) {
      const digest =
        typeof err === "object" && err && "digest" in err
          ? String((err as { digest?: unknown }).digest || "")
          : "";
      if (digest.startsWith("NEXT_REDIRECT")) throw err;
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudo enviar la postulación. Probá de nuevo.";
      setError(message);
      setSending(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <h2 className="text-lg font-bold">Postulate con tu Instagram</h2>
      <p className="text-sm text-muted-dark">
        La marca va a ver tu perfil de Instagram y va a poder abrirlo con un
        clic.
      </p>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted-dark">Nombre</span>
        <input
          name="display_name"
          defaultValue={profile?.displayName || ""}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
        />
      </label>
      <InstagramHandleInput
        name="handle"
        required
        defaultValue={profile?.handle || ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted-dark">Categoría</span>
          <input
            name="category"
            defaultValue={profile?.category || ""}
            placeholder="Gastronomía"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted-dark">Seguidores</span>
          <input
            name="followers"
            type="number"
            defaultValue={profile?.followers || 0}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted-dark">Ciudad</span>
        <input
          name="city"
          defaultValue={profile?.city || ""}
          placeholder="Buenos Aires"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted-dark">Mensaje (opcional)</span>
        <textarea
          name="message"
          rows={3}
          placeholder="Contale a la marca por qué encajás…"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
        />
      </label>
      {error ? (
        <p className="text-sm font-semibold text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-full bg-purple py-3 text-sm font-bold text-white hover:bg-purple-2 disabled:opacity-60"
      >
        {sending ? "Enviando…" : "Enviar postulación"}
      </button>
    </form>
  );
}
