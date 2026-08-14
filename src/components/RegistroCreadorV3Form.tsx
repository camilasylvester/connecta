"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RegistroClerkSignUp } from "@/components/RegistroClerkSignUp";
import { Logo } from "@/components/Logo";
import {
  CATEGORY_TREE,
  GENERO_OPTIONS,
  IDIOMA_OPTIONS,
  PLATAFORMA_OPTIONS,
  UBICACION_OPTIONS,
  emptyCreatorDraft,
  saveCreatorDraft,
  type CreatorRegistroV3Draft,
} from "@/lib/creator-registro-v3";
import { normalizeInstagramHandle } from "@/lib/instagram";

const STEPS = [
  { label: "Sobre vos" },
  { label: "Categorías" },
  { label: "Tus redes" },
  { label: "Revisión" },
] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`registro-chip${active ? " is-selected" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RegistroCreadorV3Form({
  initialInstagram = "",
  next = "",
  variant = "signup",
  onComplete,
}: {
  initialInstagram?: string;
  next?: string;
  variant?: "signup" | "profile";
  onComplete?: (draft: CreatorRegistroV3Draft) => void | Promise<void>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<CreatorRegistroV3Draft>(() =>
    emptyCreatorDraft(normalizeInstagramHandle(initialInstagram) || initialInstagram)
  );
  const [error, setError] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const totalSubs = useMemo(
    () => Object.values(CATEGORY_TREE).reduce((acc, subs) => acc + subs.length, 0),
    []
  );

  function validate(current: number): boolean {
    if (current === 1) {
      const ok =
        profile.nombre.trim().length > 0 &&
        !!profile.ubicacion &&
        !!profile.genero &&
        profile.idiomas.length > 0;
      if (!ok) setError("Completá tu nombre, ubicación, género e idioma antes de continuar.");
      return ok;
    }
    if (current === 2) {
      const ok = profile.categoriaSet.length > 0;
      if (!ok) setError("Elegí al menos un subnicho para continuar.");
      return ok;
    }
    if (current === 3) {
      const ok =
        Object.keys(profile.redes).length > 0 &&
        Object.values(profile.redes).some((v) => v > 0);
      if (!ok) setError("Activá al menos una red y cargá tus seguidores.");
      return ok;
    }
    return true;
  }

  function goNext() {
    setError(null);
    if (step < 4) {
      if (!validate(step)) return;
      const nextStep = step + 1;
      if (nextStep === 4) saveCreatorDraft(profile);
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (variant === "profile") {
      saveCreatorDraft(profile);
      void onComplete?.(profile);
    }
  }

  function goBack() {
    setError(null);
    if (step === 1) {
      router.push("/login?tab=signup&as=creador");
      return;
    }
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleParent(cat: string, checked: boolean) {
    setProfile((prev) => {
      const nextSet = new Set(prev.categoriaSet);
      for (const sub of CATEGORY_TREE[cat]) {
        const key = `${cat}|${sub}`;
        if (checked) nextSet.add(key);
        else nextSet.delete(key);
      }
      return { ...prev, categoriaSet: Array.from(nextSet) };
    });
  }

  function toggleChild(cat: string, sub: string, checked: boolean) {
    setProfile((prev) => {
      const nextSet = new Set(prev.categoriaSet);
      const key = `${cat}|${sub}`;
      if (checked) nextSet.add(key);
      else nextSet.delete(key);
      return { ...prev, categoriaSet: Array.from(nextSet) };
    });
  }

  function toggleRed(platform: string) {
    setProfile((prev) => {
      const nextRedes = { ...prev.redes };
      if (Object.hasOwn(nextRedes, platform)) {
        delete nextRedes[platform];
      } else {
        nextRedes[platform] = 0;
      }
      return { ...prev, redes: nextRedes };
    });
  }

  const catsByParent = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const key of profile.categoriaSet) {
      const [cat, sub] = key.split("|");
      if (!cat || !sub) continue;
      grouped[cat] = grouped[cat] || [];
      grouped[cat].push(sub);
    }
    return grouped;
  }, [profile.categoriaSet]);

  return (
    <div className="registro-v3-page">
      <header className="auth-header registro-v3-header">
        <Logo href="/" className="auth-logo" />
        <Link href="/login?tab=signup&as=creador" className="auth-back">
          ← Cancelar
        </Link>
      </header>

      <main className="registro-v3-main">
        <div className="registro-v3-wrap">
          <div className="registro-stepper">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const state =
                n < step ? "done" : n === step ? "active" : "";
              return (
                <div key={s.label} className="registro-step-dot-wrap">
                  <div className={`registro-step-dot ${state}`}>
                    {n < step ? "✓" : n}
                  </div>
                  <span className={`registro-step-label${n === step ? " is-active" : ""}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="registro-step-card">
            {step === 1 ? (
              <>
                <h2 className="registro-step-title">Sobre vos</h2>
                <p className="registro-step-sub">
                  Estos datos ayudan a las marcas a encontrarte con precisión.
                </p>
                <div className="auth-field">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    id="nombre"
                    value={profile.nombre}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, nombre: e.target.value }))
                    }
                    placeholder="Tu nombre o el de tu marca personal"
                  />
                </div>
                <div className="auth-field">
                  <label>Ubicación</label>
                  <div className="registro-chip-row">
                    {UBICACION_OPTIONS.map((u) => (
                      <Chip
                        key={u}
                        active={profile.ubicacion === u}
                        onClick={() => setProfile((p) => ({ ...p, ubicacion: u }))}
                      >
                        {u}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label>Género</label>
                  <div className="registro-chip-row">
                    {GENERO_OPTIONS.map((g) => (
                      <Chip
                        key={g}
                        active={profile.genero === g}
                        onClick={() => setProfile((p) => ({ ...p, genero: g }))}
                      >
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label>Idiomas en los que creás contenido</label>
                  <div className="registro-chip-row">
                    {IDIOMA_OPTIONS.map((i) => (
                      <Chip
                        key={i}
                        active={profile.idiomas.includes(i)}
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            idiomas: p.idiomas.includes(i)
                              ? p.idiomas.filter((x) => x !== i)
                              : [...p.idiomas, i],
                          }))
                        }
                      >
                        {i}
                      </Chip>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="registro-step-title">Tus categorías</h2>
                <p className="registro-step-sub">
                  Elegí todo lo que crees. Podés tildar una categoría completa o solo subnichos específicos.
                </p>
                <input
                  className="registro-tree-search"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Buscar categoría o subnicho..."
                />
                <p className="registro-tree-count">
                  {profile.categoriaSet.length} subnichos seleccionados de {totalSubs} disponibles
                </p>
                <div className="registro-tree-scroll">
                  {Object.entries(CATEGORY_TREE).map(([cat, subs]) => {
                    const term = catSearch.trim().toLowerCase();
                    const visible =
                      !term ||
                      cat.toLowerCase().includes(term) ||
                      subs.some((sub) => sub.toLowerCase().includes(term));
                    if (!visible) return null;
                    const childKeys = subs.map((sub) => `${cat}|${sub}`);
                    const checkedCount = childKeys.filter((k) =>
                      profile.categoriaSet.includes(k)
                    ).length;
                    const allChecked = checkedCount === subs.length;
                    const expanded = expandedCats[cat] ?? !!term;
                    return (
                      <div key={cat} className="registro-tree-cat">
                        <label className="registro-tree-parent">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate =
                                  checkedCount > 0 && checkedCount < subs.length;
                              }
                            }}
                            onChange={(e) => toggleParent(cat, e.target.checked)}
                          />
                          <span>{cat}</span>
                          <button
                            type="button"
                            className={`registro-tree-chevron${expanded ? " is-expanded" : ""}`}
                            onClick={() =>
                              setExpandedCats((prev) => ({
                                ...prev,
                                [cat]: !expanded,
                              }))
                            }
                          >
                            ▾
                          </button>
                        </label>
                        <div className={`registro-tree-children${expanded ? " is-expanded" : ""}`}>
                          {subs.map((sub) => {
                            const key = `${cat}|${sub}`;
                            return (
                              <label key={key} className="registro-tree-child">
                                <input
                                  type="checkbox"
                                  checked={profile.categoriaSet.includes(key)}
                                  onChange={(e) =>
                                    toggleChild(cat, sub, e.target.checked)
                                  }
                                />
                                <span>{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="registro-step-title">Tus redes</h2>
                <p className="registro-step-sub">
                  Activá las plataformas donde creás contenido y cargá tu cantidad de seguidores en cada una.
                </p>
                {PLATAFORMA_OPTIONS.map((platform) => {
                  const active = Object.hasOwn(profile.redes, platform);
                  return (
                    <div
                      key={platform}
                      className={`registro-red-row${active ? " is-active" : ""}`}
                    >
                      <button
                        type="button"
                        className="registro-red-left"
                        onClick={() => toggleRed(platform)}
                      >
                        <span className="registro-red-check">{active ? "✓" : ""}</span>
                        <span className="registro-red-name">{platform}</span>
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`registro-red-input${active ? " is-visible" : ""}`}
                        placeholder="Seguidores"
                        value={active ? String(profile.redes[platform] || "") : ""}
                        onChange={(e) => {
                          const num =
                            parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                          setProfile((p) => ({
                            ...p,
                            redes: { ...p.redes, [platform]: num },
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <h2 className="registro-step-title">Revisá tu perfil</h2>
                <p className="registro-step-sub">
                  Así te van a ver las marcas en Connecta. Podés volver atrás para ajustar cualquier dato.
                </p>
                <div className="registro-review-section">
                  <div className="registro-review-label">Instagram</div>
                  <div className="registro-review-value">
                    {normalizeInstagramHandle(profile.instagram) || "—"}
                  </div>
                </div>
                <div className="registro-review-section">
                  <div className="registro-review-label">Nombre</div>
                  <div className="registro-review-value">{profile.nombre || "—"}</div>
                </div>
                <div className="registro-review-section">
                  <div className="registro-review-label">Ubicación · Género</div>
                  <div className="registro-review-pills">
                    {profile.ubicacion ? (
                      <span className="registro-review-pill">{profile.ubicacion}</span>
                    ) : null}
                    {profile.genero ? (
                      <span className="registro-review-pill">{profile.genero}</span>
                    ) : null}
                  </div>
                </div>
                <div className="registro-review-section">
                  <div className="registro-review-label">Idiomas</div>
                  <div className="registro-review-pills">
                    {profile.idiomas.length ? (
                      profile.idiomas.map((i) => (
                        <span key={i} className="registro-review-pill">
                          {i}
                        </span>
                      ))
                    ) : (
                      <span className="registro-review-empty">Sin cargar</span>
                    )}
                  </div>
                </div>
                <div className="registro-review-section">
                  <div className="registro-review-label">
                    Categorías ({profile.categoriaSet.length} subnichos)
                  </div>
                  {Object.keys(catsByParent).length ? (
                    Object.entries(catsByParent).map(([cat, subs]) => (
                      <div key={cat} className="registro-review-cat-group">
                        <div className="registro-review-cat-name">{cat}</div>
                        <div className="registro-review-cat-subs">{subs.join(" · ")}</div>
                      </div>
                    ))
                  ) : (
                    <div className="registro-review-empty">Sin cargar</div>
                  )}
                </div>
                <div className="registro-review-section">
                  <div className="registro-review-label">Redes</div>
                  {Object.keys(profile.redes).length ? (
                    Object.entries(profile.redes).map(([platform, count]) => (
                      <div key={platform} className="registro-review-red-item">
                        <span>{platform}</span>
                        <span>{count.toLocaleString("es-AR")} seguidores</span>
                      </div>
                    ))
                  ) : (
                    <div className="registro-review-empty">Sin cargar</div>
                  )}
                </div>
                <div className="registro-clerk-wrap">
                  {variant === "signup" ? (
                    <RegistroClerkSignUp role="creator" next={next} />
                  ) : (
                    <button
                      type="button"
                      className="auth-primary"
                      onClick={() => {
                        saveCreatorDraft(profile);
                        void onComplete?.(profile);
                      }}
                    >
                      Enviar solicitud
                    </button>
                  )}
                </div>
              </>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}
          </div>

          {step < 4 ? (
            <div className="registro-step-nav">
              <button type="button" className="auth-alt-btn" onClick={goBack}>
                {step === 1 ? "Cancelar" : "Atrás"}
              </button>
              <button type="button" className="auth-primary registro-next-btn" onClick={goNext}>
                Continuar
              </button>
            </div>
          ) : variant === "profile" ? (
            <div className="registro-step-nav">
              <button type="button" className="auth-alt-btn" onClick={goBack}>
                Atrás
              </button>
            </div>
          ) : (
            <div className="registro-step-nav">
              <button type="button" className="auth-alt-btn" onClick={goBack}>
                Atrás
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
