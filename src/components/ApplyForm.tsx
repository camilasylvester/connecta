"use client";

import { useRef, useState } from "react";
import { applyToEvent, setMyAvatar } from "@/app/actions";
import { InstagramHandleInput } from "@/components/InstagramHandleInput";
import { cropToSquareDataUrl } from "@/lib/avatar-crop";
import { uploadConnectaImage } from "@/lib/blob-upload";
import type { Profile } from "@/lib/types";

/**
 * Paso previo a postularse cuando el creador no tiene foto de perfil
 * (obligatoria desde 26/09; el servidor también lo exige en applyToEvent).
 */
function AvatarRequired({ onDone }: { onDone: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Elegí una imagen (JPG o PNG).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await cropToSquareDataUrl(file);
      setPreview(dataUrl);
      const fd = new FormData();
      fd.set("folder", "avatars");
      fd.set("dataUrl", dataUrl);
      const { url } = await uploadConnectaImage(fd);
      await setMyAvatar(url);
      onDone(url);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Subí tu foto de perfil</h2>
      <p className="text-sm text-muted-dark">
        Para postularte necesitás una foto de perfil: es lo primero que ve la
        marca cuando revisa las postulaciones. Se guarda en tu perfil y la
        podés cambiar cuando quieras desde Mi perfil.
      </p>
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-black/30 text-2xl text-muted-dark">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>＋</span>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-full bg-purple px-6 py-3 text-sm font-bold text-white hover:bg-purple-2 disabled:opacity-60"
        >
          {busy ? "Subiendo…" : "Elegir foto"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0] || null)}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
    </div>
  );
}

export function ApplyForm({
  eventId,
  profile,
}: {
  eventId: string;
  profile: Profile | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const readyProfile = Boolean(profile?.handle);

  // Creador logueado sin foto: primero la foto, después el formulario.
  if (profile?.role === "creator" && !avatarUrl) {
    return <AvatarRequired onDone={setAvatarUrl} />;
  }

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

  if (readyProfile) {
    return (
      <form action={action} className="space-y-4">
        <h2 className="text-lg font-bold">Postulate</h2>
        <p className="text-sm text-muted-dark">
          Vamos a enviar tu ficha de Connecta ({profile?.handle}). Podés sumar un
          mensaje para la marca.
        </p>
        <input type="hidden" name="display_name" value={profile?.displayName || ""} />
        <input type="hidden" name="handle" value={profile?.handle || ""} />
        <input type="hidden" name="category" value={profile?.category || ""} />
        <input type="hidden" name="followers" value={String(profile?.followers || 0)} />
        <input type="hidden" name="city" value={profile?.city || ""} />
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
