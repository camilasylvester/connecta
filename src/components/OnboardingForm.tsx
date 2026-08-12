"use client";

import { useMemo, useState } from "react";
import {
  BRAND_GOALS,
  CONTENT_THEME_GROUPS,
  emptyOnboarding,
  INFLUENCER_EXPERIENCE,
  INDUSTRIES,
  type OnboardingPayload,
  type OnboardingRole,
  PLATFORMS,
  PROVINCES,
  validateOnboarding,
} from "@/lib/onboarding";
import { normalizeInstagramHandle } from "@/lib/instagram";

const field =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-purple";
const labelCls = "mb-1.5 block text-sm text-muted-dark";
const sectionTitle = "text-lg font-bold text-white";
const sectionHint = "mt-1 text-sm text-muted-dark";

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

function Chip({
  active,
  onClick,
  children,
  light = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
        active
          ? "border-purple bg-purple/30 text-white"
          : light
            ? "border-black/10 bg-white text-[rgba(10,10,10,0.56)] hover:border-purple/40 hover:text-ink"
            : "border-white/10 bg-black/20 text-muted-dark hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** Non-interactive tag for read-only theme summary. */
function ThemeTag({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${
        light
          ? "border-purple/25 bg-purple/10 text-ink"
          : "border-purple/40 bg-purple/25 text-white"
      }`}
    >
      {children}
    </span>
  );
}

const themeGroupsGrid =
  "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

export function OnboardingForm({
  initialRole = "creator",
  initial,
  lockRole = false,
  submitLabel = "Continuar al registro",
  variant = "dark",
  onComplete,
}: {
  initialRole?: OnboardingRole;
  initial?: OnboardingPayload;
  lockRole?: boolean;
  submitLabel?: string;
  variant?: "dark" | "light";
  onComplete: (data: OnboardingPayload) => void | Promise<void>;
}) {
  const [data, setData] = useState<OnboardingPayload>(
    () => initial || emptyOnboarding(initialRole)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Profile edit: themes start as read-only summary; signup stays interactive
  const [editingThemes, setEditingThemes] = useState(!lockRole);

  const light = variant === "light";
  const fieldCls = light
    ? "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
    : field;
  const labelClass = light
    ? "mb-1.5 block text-sm text-[rgba(10,10,10,0.56)]"
    : labelCls;
  const titleClass = light
    ? "text-lg font-bold text-ink"
    : sectionTitle;
  const hintClass = light
    ? "mt-1 text-sm text-[rgba(10,10,10,0.56)]"
    : sectionHint;

  const igPreview = useMemo(
    () => normalizeInstagramHandle(data.instagram),
    [data.instagram]
  );

  function set<K extends keyof OnboardingPayload>(key: K, value: OnboardingPayload[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = {
      ...data,
      instagram: normalizeInstagramHandle(data.instagram) || data.instagram.trim(),
      tiktok: data.tiktok.trim()
        ? data.tiktok.startsWith("@")
          ? data.tiktok.trim()
          : `@${data.tiktok.trim().replace(/^@/, "")}`
        : "",
      fullName: data.fullName.trim(),
      contactEmail: data.contactEmail.trim().toLowerCase(),
    };
    const result = validateOnboarding(normalized);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onComplete(normalized);
      if (lockRole) setEditingThemes(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const selectedThemeGroups = useMemo(() => {
    return CONTENT_THEME_GROUPS.map((group) => ({
      group: group.group,
      options: group.options.filter((opt) => data.contentThemes.includes(opt)),
    })).filter((g) => g.options.length > 0);
  }, [data.contentThemes]);

  return (
    <form onSubmit={submit} className="space-y-10">
      <section>
        <h2 className={titleClass}>Datos generales</h2>
        <p className={hintClass}>Información personal — para marcas y creadores.</p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className={labelClass}>Nombre y apellido *</span>
            <input
              className={fieldCls}
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Tu Nombre"
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>Usuario de Instagram *</span>
            <input
              className={fieldCls}
              value={data.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="@tu.usuario"
              required
            />
            {igPreview ? (
              <a
                href={`https://instagram.com/${igPreview.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-purple-2 hover:underline"
              >
                Abrir {igPreview} →
              </a>
            ) : null}
          </label>

          <label className="block">
            <span className={labelClass}>Usuario de TikTok (opcional)</span>
            <input
              className={fieldCls}
              value={data.tiktok}
              onChange={(e) => set("tiktok", e.target.value)}
              placeholder="@tu.tiktok"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Provincia *</span>
            <select
              className={fieldCls}
              value={data.province}
              onChange={(e) => set("province", e.target.value)}
              required
            >
              <option value="">Elegí una opción</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Edad (opcional)</span>
              <input
                className={fieldCls}
                type="number"
                min={13}
                max={100}
                value={data.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="25"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Número de teléfono</span>
              <input
                className={fieldCls}
                value={data.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+54 9 11 …"
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Email de contacto *</span>
            <input
              className={fieldCls}
              type="email"
              value={data.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="hola@email.com"
              required
            />
          </label>

          <div>
            <span className={labelClass}>Perfil *</span>
            {lockRole ? (
              <p
                className={`mt-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  light
                    ? "border-black/10 bg-black/[0.03] text-ink"
                    : "border-white/10 bg-black/25 text-white"
                }`}
              >
                {data.role === "brand"
                  ? "Marca / Empresa"
                  : "Creador de contenido"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["creator", "Creador de contenido"],
                    ["brand", "Marca / Empresa"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set("role", id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                      data.role === id
                        ? "border-purple bg-purple/25 text-white"
                        : light
                          ? "border-black/10 text-[rgba(10,10,10,0.56)]"
                          : "border-white/10 text-muted-dark hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {data.role === "brand" ? (
        <section>
          <h2 className={titleClass}>Información de la empresa</h2>
          <p className={hintClass}>Solo para marcas / empresas.</p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className={labelClass}>
                Nombre de la marca / empresa / emprendimiento *
              </span>
              <input
                className={fieldCls}
                value={data.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                placeholder="Costa 7070"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Rubro / Industria *</span>
              <select
                className={fieldCls}
                value={data.industry}
                onChange={(e) => set("industry", e.target.value)}
              >
                <option value="">Elegí una opción</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Ciudad / Provincia *</span>
              <input
                className={fieldCls}
                value={data.companyLocation}
                onChange={(e) => set("companyLocation", e.target.value)}
                placeholder="Palermo, CABA"
              />
            </label>

            <div className={`rounded-xl border p-4 ${light ? "border-black/10 bg-black/[0.03]" : "border-white/10 bg-black/20"}`}>
              <h3 className={`text-sm font-bold ${light ? "text-ink" : "text-white"}`}>Persona de contacto</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className={labelClass}>
                    Nombre y cargo de la persona de contacto *
                  </span>
                  <input
                    className={fieldCls}
                    value={data.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                    placeholder="Ana López — Marketing"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Mail o WhatsApp de contacto *</span>
                  <input
                    className={fieldCls}
                    value={data.contactChannel}
                    onChange={(e) => set("contactChannel", e.target.value)}
                    placeholder="ana@marca.com / +54 9 …"
                  />
                </label>
              </div>
            </div>

            <div>
              <span className={labelClass}>
                ¿Trabajaron antes con influencers o microinfluencers? *
              </span>
              <div className="flex flex-wrap gap-2">
                {INFLUENCER_EXPERIENCE.map((opt) => (
                  <Chip
                    key={opt}
                    light={light}
                    active={data.influencerExperience === opt}
                    onClick={() => set("influencerExperience", opt)}
                  >
                    {opt}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className={labelClass}>
                ¿Qué buscan lograr con este tipo de colaboraciones? *
              </span>
              <div className="flex flex-wrap gap-2">
                {BRAND_GOALS.map((opt) => (
                  <Chip
                    key={opt}
                    light={light}
                    active={data.goals.includes(opt)}
                    onClick={() => set("goals", toggleInList(data.goals, opt))}
                  >
                    {opt}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <h2 className={titleClass}>Perfil de creador</h2>
          <p className={hintClass}>Temáticas y plataformas de tu contenido.</p>

          <div className="mt-5 space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className={labelClass}>
                  ¿Sobre qué temáticas creás contenido principalmente? *
                </span>
                {lockRole && !editingThemes ? (
                  <button
                    type="button"
                    onClick={() => setEditingThemes(true)}
                    className={`shrink-0 rounded-full bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple-2`}
                  >
                    Editar mi perfil
                  </button>
                ) : null}
                {lockRole && editingThemes ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (initial) {
                        set("contentThemes", [...initial.contentThemes]);
                      }
                      setEditingThemes(false);
                    }}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${
                      light
                        ? "border-black/15 text-ink"
                        : "border-white/20 text-white"
                    }`}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>

              {!editingThemes ? (
                <div
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    light
                      ? "border-black/10 bg-black/[0.02]"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <p
                    className={`mb-3 text-xs font-bold uppercase tracking-wide ${
                      light ? "text-[rgba(10,10,10,0.45)]" : "text-muted-dark"
                    }`}
                  >
                    Tus temáticas
                  </p>
                  {selectedThemeGroups.length === 0 ? (
                    <p
                      className={`text-sm ${
                        light
                          ? "text-[rgba(10,10,10,0.56)]"
                          : "text-muted-dark"
                      }`}
                    >
                      Todavía no elegiste temáticas.
                    </p>
                  ) : (
                    <div className={themeGroupsGrid}>
                      {selectedThemeGroups.map((group) => (
                        <div key={group.group}>
                          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-2">
                            {group.group}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt) => (
                              <ThemeTag key={opt} light={light}>
                                {opt}
                              </ThemeTag>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={themeGroupsGrid}>
                  {CONTENT_THEME_GROUPS.map((group) => (
                    <div key={group.group}>
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-purple-2">
                        {group.group}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <Chip
                            key={opt}
                            light={light}
                            active={data.contentThemes.includes(opt)}
                            onClick={() =>
                              set(
                                "contentThemes",
                                toggleInList(data.contentThemes, opt)
                              )
                            }
                          >
                            {opt}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className={labelClass}>
                ¿En qué plataformas solés crear contenido? *
              </span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((opt) => (
                  <Chip
                    key={opt}
                    light={light}
                    active={data.platforms.includes(opt)}
                    onClick={() =>
                      set("platforms", toggleInList(data.platforms, opt))
                    }
                  >
                    {opt}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {error ? (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-purple py-3.5 text-sm font-bold text-white hover:bg-purple-2 disabled:opacity-60"
      >
        {saving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
