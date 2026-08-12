"use client";

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
  async function action(formData: FormData) {
    await applyToEvent(eventId, formData);
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
      <button
        type="submit"
        className="w-full rounded-full bg-purple py-3 text-sm font-bold text-white hover:bg-purple-2"
      >
        Enviar postulación
      </button>
    </form>
  );
}
