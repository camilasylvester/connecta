"use client";

import { useRef, useState } from "react";
import { uploadConnectaImage } from "@/lib/blob-upload";
import { compressImageFile } from "@/lib/image-compress";

const MAX = 5;

export function EventImagesField({
  name = "image_urls",
  initial = [],
}: {
  name?: string;
  initial?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        if (next.length >= MAX) break;
        if (!file.type.startsWith("image/")) {
          setError("Solo imágenes JPG o PNG");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Alguna imagen supera 10 MB");
          continue;
        }
        const dataUrl = await compressImageFile(file, 1200);
        const fd = new FormData();
        fd.set("folder", "events");
        fd.set("dataUrl", dataUrl);
        const { url } = await uploadConnectaImage(fd);
        next.push(url);
      }
      setImages(next.slice(0, MAX));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="config-field">
      <label>Imágenes del evento</label>
      <p className="mb-3 text-xs" style={{ color: "var(--faint, #8b8a96)" }}>
        Hasta {MAX}. La primera se usa como portada en el feed.
      </p>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />

      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div
            key={`${i}-${src.slice(0, 48)}`}
            className="relative h-24 w-32 overflow-hidden rounded-xl border border-white/12 bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                Portada
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-600"
            >
              Quitar
            </button>
          </div>
        ))}

        {images.length < MAX ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-xs font-bold text-white/55 hover:border-purple hover:text-white disabled:opacity-60"
          >
            {busy ? "Subiendo…" : "+ Agregar"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
