"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_TREE,
  COLABORACIONES_BUCKETS,
  EMPTY_CREATOR_FILTERS,
  PUNTUACION_OPTIONS,
  SEARCH_GENEROS,
  SEARCH_IDIOMAS,
  SEARCH_PLATAFORMAS,
  SEARCH_UBICACIONES,
  SEGUIDORES_BUCKETS,
  anyCreatorFilterActive,
  matchesCreatorFilters,
  matchesSearchTerm,
  type CreatorSearchCard,
  type CreatorSearchFilters,
} from "@/lib/creator-search";
import "./explorer.css";

const FILTER_LABELS: Record<keyof Omit<CreatorSearchFilters, "puntuacion"> | "puntuacion", string> = {
  seguidores: "Seguidores",
  ubicacion: "Ubicación",
  genero: "Género",
  idioma: "Idioma",
  categoriaSet: "Categoría",
  colaboraciones: "Colaboraciones",
  plataforma: "Plataforma",
  puntuacion: "Puntuación",
};

function categorySelectionCount(keys: string[]) {
  return new Set(keys.map((k) => k.split("|")[0])).size;
}

function buttonLabel(key: keyof typeof FILTER_LABELS, filters: CreatorSearchFilters) {
  const base = FILTER_LABELS[key];
  if (key === "puntuacion") return filters.puntuacion ? `${base} (1)` : base;
  if (key === "categoriaSet") {
    const n = categorySelectionCount(filters.categoriaSet);
    return n ? `${base} (${n})` : base;
  }
  const n = filters[key].length;
  return n ? `${base} (${n})` : base;
}

function hasSelection(key: keyof typeof FILTER_LABELS, filters: CreatorSearchFilters) {
  if (key === "puntuacion") return Boolean(filters.puntuacion);
  if (key === "categoriaSet") return filters.categoriaSet.length > 0;
  return filters[key].length > 0;
}

function toggleIn(list: string[], value: string) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function CreatorExplorer({ creators }: { creators: CreatorSearchCard[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CreatorSearchFilters>(EMPTY_CREATOR_FILTERS);
  const [open, setOpen] = useState<keyof typeof FILTER_LABELS | null>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [catQuery, setCatQuery] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const btnRefs = useRef<Partial<Record<keyof typeof FILTER_LABELS, HTMLButtonElement | null>>>({});

  useEffect(() => {
    function close() {
      setOpen(null);
    }
    function onDoc(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const inBar = (target as HTMLElement).closest?.("#filterbar, .explorer-fpanel");
      if (!inBar) close();
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", onDoc);
    };
  }, []);

  function openPanel(key: keyof typeof FILTER_LABELS) {
    const btn = btnRefs.current[key];
    if (!btn) return;
    if (open === key) {
      setOpen(null);
      return;
    }
    const rect = btn.getBoundingClientRect();
    const width = key === "categoriaSet" ? 320 : 280;
    let left = rect.left;
    const maxLeft = window.innerWidth - width - 12;
    if (left > maxLeft) left = Math.max(12, maxLeft);
    let top = rect.bottom + 8;
    const maxTop = window.innerHeight - 380 - 12;
    if (top > maxTop) top = Math.max(12, rect.top - 388);
    setPanelPos({ top, left });
    setOpen(key);
  }

  const filtered = useMemo(() => {
    const term = query.trim();
    return creators.filter(
      (card) => matchesCreatorFilters(card, filters) && matchesSearchTerm(card, term)
    );
  }, [creators, filters, query]);

  const suggested = useMemo(
    () => creators.filter((c) => c.trending).slice(0, 12),
    [creators]
  );

  function clearFilters() {
    setFilters(EMPTY_CREATOR_FILTERS);
    setCatQuery("");
    setOpenCats({});
    setOpen(null);
  }

  const subCount = Object.values(CATEGORY_TREE).reduce((a, s) => a + s.length, 0);

  return (
    <div className="explorer">
      <div className="explorer-search">
        <span aria-hidden>⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar creadores…"
        />
      </div>

      <div className="explorer-filterbar" id="filterbar">
        {(
          [
            "seguidores",
            "ubicacion",
            "genero",
            "idioma",
            "categoriaSet",
            "colaboraciones",
            "plataforma",
            "puntuacion",
          ] as const
        ).map((key) => (
          <button
            key={key}
            type="button"
            className={`explorer-fbtn${open === key ? " is-open" : ""}${
              hasSelection(key, filters) ? " has-selection" : ""
            }`}
            ref={(el) => {
              btnRefs.current[key] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              openPanel(key);
            }}
          >
            {buttonLabel(key, filters)}
            <span aria-hidden>▾</span>
          </button>
        ))}
        {anyCreatorFilterActive(filters) ? (
          <button
            type="button"
            className="explorer-fbtn-clear"
            onClick={(e) => {
              e.stopPropagation();
              clearFilters();
            }}
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={`explorer-fpanel${open === "categoriaSet" ? " explorer-fpanel-wide" : ""}`}
          style={{ top: panelPos.top, left: panelPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {open === "seguidores"
            ? SEGUIDORES_BUCKETS.map((b) => (
                <label key={b.key} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.seguidores.includes(b.key)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        seguidores: toggleIn(f.seguidores, b.key),
                      }))
                    }
                  />
                  {b.label}
                </label>
              ))
            : null}
          {open === "ubicacion"
            ? SEARCH_UBICACIONES.map((opt) => (
                <label key={opt} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.ubicacion.includes(opt)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        ubicacion: toggleIn(f.ubicacion, opt),
                      }))
                    }
                  />
                  {opt}
                </label>
              ))
            : null}
          {open === "genero"
            ? SEARCH_GENEROS.map((opt) => (
                <label key={opt} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.genero.includes(opt)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, genero: toggleIn(f.genero, opt) }))
                    }
                  />
                  {opt}
                </label>
              ))
            : null}
          {open === "idioma"
            ? SEARCH_IDIOMAS.map((opt) => (
                <label key={opt} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.idioma.includes(opt)}
                    onChange={() =>
                      setFilters((f) => ({ ...f, idioma: toggleIn(f.idioma, opt) }))
                    }
                  />
                  {opt}
                </label>
              ))
            : null}
          {open === "colaboraciones"
            ? COLABORACIONES_BUCKETS.map((b) => (
                <label key={b.key} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.colaboraciones.includes(b.key)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        colaboraciones: toggleIn(f.colaboraciones, b.key),
                      }))
                    }
                  />
                  {b.label}
                </label>
              ))
            : null}
          {open === "plataforma"
            ? SEARCH_PLATAFORMAS.map((opt) => (
                <label key={opt} className="explorer-fpanel-item">
                  <input
                    type="checkbox"
                    checked={filters.plataforma.includes(opt)}
                    onChange={() =>
                      setFilters((f) => ({
                        ...f,
                        plataforma: toggleIn(f.plataforma, opt),
                      }))
                    }
                  />
                  {opt}
                </label>
              ))
            : null}
          {open === "puntuacion" ? (
            <>
              {PUNTUACION_OPTIONS.map((opt) => (
                <label key={opt.key} className="explorer-fpanel-item">
                  <input
                    type="radio"
                    name="puntuacion"
                    checked={filters.puntuacion === opt.key}
                    onChange={() =>
                      setFilters((f) => ({ ...f, puntuacion: opt.key }))
                    }
                  />
                  {opt.label}
                </label>
              ))}
              <div className="explorer-fpanel-divider" />
              <label className="explorer-fpanel-item">
                <input
                  type="radio"
                  name="puntuacion"
                  checked={filters.puntuacion === null}
                  onChange={() => setFilters((f) => ({ ...f, puntuacion: null }))}
                />
                Cualquier puntuación
              </label>
            </>
          ) : null}
          {open === "categoriaSet" ? (
            <>
              <input
                className="explorer-ftree-search"
                placeholder="Buscar categoría o subnicho..."
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
              />
              <div className="explorer-ftree-count">
                {Object.keys(CATEGORY_TREE).length} categorías · {subCount} subnichos
              </div>
              {Object.entries(CATEGORY_TREE).map(([cat, subs]) => {
                const term = catQuery.trim().toLowerCase();
                const catHit = cat.toLowerCase().includes(term);
                const subHit = subs.some((s) => s.toLowerCase().includes(term));
                if (term && !catHit && !subHit) return null;
                const selectedSubs = subs.filter((sub) =>
                  filters.categoriaSet.includes(`${cat}|${sub}`)
                );
                const allOn = selectedSubs.length === subs.length;
                const someOn = selectedSubs.length > 0 && !allOn;
                const expanded = openCats[cat] || Boolean(term && subHit && !catHit);
                return (
                  <div key={cat}>
                    <label className="explorer-fpanel-item explorer-ftree-parent">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => {
                          if (el) el.indeterminate = someOn;
                        }}
                        onChange={() => {
                          setFilters((f) => {
                            const next = new Set(f.categoriaSet);
                            if (allOn) {
                              for (const sub of subs) next.delete(`${cat}|${sub}`);
                            } else {
                              for (const sub of subs) next.add(`${cat}|${sub}`);
                            }
                            return { ...f, categoriaSet: Array.from(next) };
                          });
                        }}
                      />
                      {cat}
                      <button
                        type="button"
                        className={`explorer-ftree-chevron${expanded ? " is-open" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
                        }}
                      >
                        ▾
                      </button>
                    </label>
                    <div className={`explorer-ftree-children${expanded ? " is-open" : ""}`}>
                      {subs.map((sub) => {
                        const key = `${cat}|${sub}`;
                        return (
                          <label
                            key={key}
                            className="explorer-fpanel-item explorer-ftree-child"
                          >
                            <input
                              type="checkbox"
                              checked={filters.categoriaSet.includes(key)}
                              onChange={() =>
                                setFilters((f) => ({
                                  ...f,
                                  categoriaSet: toggleIn(f.categoriaSet, key),
                                }))
                              }
                            />
                            {sub}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}

      {suggested.length > 0 && !anyCreatorFilterActive(filters) && !query ? (
        <>
          <div className="explorer-head">
            <span className="section-label">Sugeridos</span>
          </div>
          <div className="explorer-suggest">
            {suggested.map((c) => (
              <Link key={c.id} href={`/dashboard/creadores/${c.id}`}>
                <div className="explorer-suggest-av">{c.name.slice(0, 1)}</div>
                <div className="explorer-suggest-name">{c.name}</div>
                <div className="explorer-suggest-tag">Creador</div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="explorer-head">
        <span className="section-label">Creadores</span>
        <span className="explorer-count">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Ningún creador coincide con esos filtros.</p>
        </div>
      ) : (
        <div className="explorer-grid">
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/dashboard/creadores/${c.id}`}
              className={`explorer-card${i % 7 === 0 ? " is-big" : ""}`}
            >
              <span className="explorer-card-letter" aria-hidden>
                {c.name.slice(0, 1)}
              </span>
              <span className="explorer-card-type">Creador</span>
              {c.trending ? <span className="explorer-card-trend">Trending</span> : null}
              <div className="explorer-card-name">{c.name}</div>
              <div className="explorer-card-meta">
                {[c.category, c.zona].filter(Boolean).join(" · ")}
              </div>
              <div className="explorer-card-stat">
                {c.colaboraciones} colaboraciones
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
