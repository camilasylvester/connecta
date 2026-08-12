"use client";

import { useMemo, useState } from "react";
import { instagramUrl, normalizeInstagramHandle } from "@/lib/instagram";

export function InstagramHandleInput({
  name = "handle",
  defaultValue = "",
  required = false,
  label = "Instagram",
  onHandleChange,
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  label?: string;
  onHandleChange?: (normalized: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const url = useMemo(() => instagramUrl(value), [value]);
  const normalized = useMemo(() => normalizeInstagramHandle(value), [value]);

  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted-dark">{label}</span>
      <input
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          const n = normalizeInstagramHandle(e.target.value);
          if (n) onHandleChange?.(n);
        }}
        placeholder="@tu.usuario"
        autoComplete="username"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple"
      />
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-2 hover:underline"
        >
          Abrir {normalized} en Instagram →
        </a>
      ) : (
        <p className="mt-2 text-xs text-muted-dark">
          Escribí tu usuario y te mostramos el link a tu perfil.
        </p>
      )}
    </label>
  );
}
