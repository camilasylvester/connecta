"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminSearchBox({
  initialQuery = "",
  compact = false,
}: {
  initialQuery?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    const href = trimmed
      ? `/admin/usuarios?q=${encodeURIComponent(trimmed)}`
      : "/admin/usuarios";
    router.push(href);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "admin-search-form is-compact" : "admin-search-form"}
      role="search"
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar marca o persona…"
        className="search-box"
        aria-label="Buscar marca o persona"
        autoComplete="off"
      />
      <button type="submit" className="btn btn-outline btn-sm">
        Buscar
      </button>
    </form>
  );
}
