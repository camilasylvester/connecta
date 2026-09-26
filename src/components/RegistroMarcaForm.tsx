"use client";

import { useEffect, useState } from "react";
import { AuthProgress } from "@/components/AuthWizardBits";
import { Logo } from "@/components/Logo";
import { TermsAcceptCheckbox } from "@/components/TermsAcceptCheckbox";
import { normalizeInstagramHandle } from "@/lib/instagram";
import {
  BRAND_GOALS,
  emptyOnboarding,
  INDUSTRIES,
  INFLUENCER_EXPERIENCE,
  PROVINCES,
  validateOnboarding,
  type OnboardingPayload,
} from "@/lib/onboarding";
import { arMobileValidationError, formatArMobileDisplay } from "@/lib/phone";
import { loadBrandDraft, saveBrandDraft } from "@/lib/signup-draft";

const STEPS = [
  { label: "Tu marca" },
  { label: "Contacto" },
  { label: "Objetivos" },
  { label: "Revisión" },
] as const;

/** Mismo chip que el wizard del creador, para que las dos altas se vean iguales. */
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
      aria-pressed={active}
      className={`registro-chip${active ? " is-selected" : ""}`}
      onClick={onClick}
      style={{
        background: active ? "#6f6ae0" : "transparent",
        border: "1.5px solid",
        borderColor: active ? "#6f6ae0" : "rgba(244, 243, 239, 0.22)",
        color: active ? "#f4f3ef" : "rgba(244, 243, 239, 0.72)",
      }}
    >
      {children}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="registro-review-section">
      <div className="registro-review-label">{label}</div>
      <div className="registro-review-value">{value || "—"}</div>
    </div>
  );
}

/**
 * Ficha de marca en etapas (Tu marca → Contacto → Objetivos → Revisión).
 *
 * - `variant="signup"`: se llena ANTES de crear la cuenta. Lo escrito se guarda
 *   como borrador local en cada cambio y `/completar-perfil` lo sube después
 *   del alta (ver `src/lib/signup-draft.ts`).
 * - `variant="profile"`: la cuenta ya existe pero la ficha quedó incompleta
 *   (por ejemplo, se perdió el borrador). Arranca con lo que haya en la base.
 */
export function RegistroMarcaForm({
  initial,
  variant = "signup",
  onComplete,
  onCancel,
}: {
  initial?: OnboardingPayload;
  variant?: "signup" | "profile";
  onComplete: (data: OnboardingPayload) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingPayload>(() => {
    const base = { ...emptyOnboarding("brand"), ...initial, role: "brand" as const };
    const draft = loadBrandDraft();
    if (!draft) return base;
    // El borrador local gana sobre la base: es lo último que escribió la persona.
    return { ...base, ...draft, role: "brand" };
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    saveBrandDraft(data);
  }, [data]);

  function set<K extends keyof OnboardingPayload>(key: K, value: OnboardingPayload[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  /** Valida solo los campos de la etapa actual; el total se revalida al enviar. */
  function validate(current: number): string | null {
    if (current === 1) {
      if (!data.brandName.trim()) return "Poné el nombre de la marca.";
      if (!data.industry) return "Elegí el rubro de la marca.";
      if (!normalizeInstagramHandle(data.instagram)) {
        return "Poné el Instagram de la marca (por ejemplo @connecta).";
      }
      if (!data.province) return "Elegí la provincia.";
      if (!data.companyLocation.trim()) return "Poné la ciudad o barrio.";
      return null;
    }
    if (current === 2) {
      if (!data.fullName.trim()) return "Poné tu nombre y apellido.";
      if (!data.contactPerson.trim()) {
        return "Poné quién es la persona de contacto y su cargo.";
      }
      const phoneErr = arMobileValidationError(data.phone);
      if (phoneErr) return phoneErr;
      if (!data.contactEmail.trim() || !data.contactEmail.includes("@")) {
        return "Poné un email de contacto válido.";
      }
      if (!data.contactChannel.trim()) {
        return "Poné el mail o WhatsApp por el que prefieren que los contactemos.";
      }
      return null;
    }
    if (current === 3) {
      if (!data.influencerExperience) {
        return "Contanos si ya trabajaron con influencers.";
      }
      if (data.goals.length === 0) return "Elegí al menos un objetivo.";
      return null;
    }
    if (current === 4) {
      if (!termsAccepted) {
        return "Tenés que aceptar los Términos y la Política de privacidad.";
      }
      const full = validateOnboarding(normalized());
      return full.ok ? null : full.error;
    }
    return null;
  }

  function normalized(): OnboardingPayload {
    return {
      ...data,
      role: "brand",
      instagram: normalizeInstagramHandle(data.instagram) || data.instagram.trim(),
      phone: formatArMobileDisplay(data.phone) || data.phone.trim(),
    };
  }

  async function goNext() {
    setError(null);
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    if (step < STEPS.length) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const final = normalized();
    saveBrandDraft(final);
    setSaving(true);
    try {
      await onComplete(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo continuar.");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === 1) {
      onCancel?.();
      return;
    }
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isLast = step === STEPS.length;
  const lastLabel = variant === "signup" ? "Continuar a crear la cuenta" : "Enviar solicitud";

  return (
    <div className="registro-v3-page">
      <header className="auth-header registro-v3-header">
        <Logo href="/" className="auth-logo" />
        {onCancel ? (
          <button type="button" className="auth-back" onClick={onCancel}>
            ← Cancelar
          </button>
        ) : null}
      </header>

      <main className="registro-v3-main">
        <div className="registro-v3-wrap">
          <div className="registro-wizard-head">
            <AuthProgress
              total={STEPS.length}
              current={step}
              labels={STEPS.map((s) => s.label)}
            />
          </div>

          <div className="registro-step-card">
            {step === 1 ? (
              <>
                <h2 className="registro-step-title">Tu marca</h2>
                <p className="registro-step-sub">
                  Así te van a conocer los creadores en Connecta.
                </p>
                <div className="auth-field">
                  <label htmlFor="brandName">Nombre de la marca / empresa *</label>
                  <input
                    id="brandName"
                    value={data.brandName}
                    onChange={(e) => set("brandName", e.target.value)}
                    placeholder="Costa 7070"
                    autoComplete="organization"
                  />
                </div>
                <div className="auth-field">
                  <label>Rubro *</label>
                  <div className="registro-chip-row">
                    {INDUSTRIES.map((i) => (
                      <Chip
                        key={i}
                        active={data.industry === i}
                        onClick={() => set("industry", i)}
                      >
                        {i}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="brandInstagram">Instagram de la marca *</label>
                  <input
                    id="brandInstagram"
                    value={data.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="@tu.marca"
                    autoComplete="off"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="brandTiktok">TikTok (opcional)</label>
                  <input
                    id="brandTiktok"
                    value={data.tiktok}
                    onChange={(e) => set("tiktok", e.target.value)}
                    placeholder="@tu.marca"
                    autoComplete="off"
                  />
                </div>
                <div className="auth-field">
                  <label>Provincia *</label>
                  <div className="registro-chip-row">
                    {PROVINCES.map((p) => (
                      <Chip
                        key={p}
                        active={data.province === p}
                        onClick={() => set("province", p)}
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="companyLocation">Ciudad / barrio *</label>
                  <input
                    id="companyLocation"
                    value={data.companyLocation}
                    onChange={(e) => set("companyLocation", e.target.value)}
                    placeholder="Palermo, CABA"
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="registro-step-title">Contacto</h2>
                <p className="registro-step-sub">
                  Con quién hablamos para revisar la cuenta y coordinar acciones.
                </p>
                <div className="auth-field">
                  <label htmlFor="fullName">Tu nombre y apellido *</label>
                  <input
                    id="fullName"
                    value={data.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Ana López"
                    autoComplete="name"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="contactPerson">
                    Persona de contacto (nombre y cargo) *
                  </label>
                  <input
                    id="contactPerson"
                    value={data.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                    placeholder="Ana López — Marketing"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="brandPhone">Celular (WhatsApp) *</label>
                  <input
                    id="brandPhone"
                    type="tel"
                    inputMode="tel"
                    value={data.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    autoComplete="tel"
                  />
                  <p className="auth-hint">Solo celular argentino.</p>
                </div>
                <div className="auth-field">
                  <label htmlFor="contactEmail">Email de contacto *</label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={data.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="hola@tumarca.com"
                    autoComplete="email"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="contactChannel">
                    ¿Por dónde prefieren que los contactemos? *
                  </label>
                  <input
                    id="contactChannel"
                    value={data.contactChannel}
                    onChange={(e) => set("contactChannel", e.target.value)}
                    placeholder="ana@tumarca.com / WhatsApp"
                  />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="registro-step-title">Objetivos</h2>
                <p className="registro-step-sub">
                  Nos ayuda a mostrarte los creadores correctos.
                </p>
                <div className="auth-field">
                  <label>¿Trabajaron antes con influencers o microinfluencers? *</label>
                  <div className="registro-chip-row">
                    {INFLUENCER_EXPERIENCE.map((opt) => (
                      <Chip
                        key={opt}
                        active={data.influencerExperience === opt}
                        onClick={() => set("influencerExperience", opt)}
                      >
                        {opt}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label>¿Qué buscan lograr con las colaboraciones? *</label>
                  <div className="registro-chip-row">
                    {BRAND_GOALS.map((opt) => (
                      <Chip
                        key={opt}
                        active={data.goals.includes(opt)}
                        onClick={() =>
                          set(
                            "goals",
                            data.goals.includes(opt)
                              ? data.goals.filter((g) => g !== opt)
                              : [...data.goals, opt]
                          )
                        }
                      >
                        {opt}
                      </Chip>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <h2 className="registro-step-title">Revisá tu ficha</h2>
                <p className="registro-step-sub">
                  Así llega tu solicitud a Connecta. Podés volver atrás para ajustar cualquier dato.
                </p>
                <ReviewRow label="Marca" value={data.brandName} />
                <ReviewRow label="Rubro" value={data.industry} />
                <ReviewRow
                  label="Instagram"
                  value={normalizeInstagramHandle(data.instagram) || ""}
                />
                <ReviewRow
                  label="Ubicación"
                  value={[data.companyLocation, data.province].filter(Boolean).join(" · ")}
                />
                <ReviewRow
                  label="Contacto"
                  value={[data.fullName, data.contactPerson].filter(Boolean).join(" · ")}
                />
                <ReviewRow
                  label="Celular / WhatsApp"
                  value={data.phone ? formatArMobileDisplay(data.phone) || data.phone : ""}
                />
                <ReviewRow label="Email" value={data.contactEmail} />
                <ReviewRow label="Experiencia con influencers" value={data.influencerExperience} />
                <div className="registro-review-section">
                  <div className="registro-review-label">Objetivos</div>
                  <div className="registro-review-pills">
                    {data.goals.map((g) => (
                      <span key={g} className="registro-review-pill">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="registro-review-section">
                  <TermsAcceptCheckbox
                    checked={termsAccepted}
                    onChange={setTermsAccepted}
                    id="brand-terms"
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}
          </div>

          <div className="registro-step-nav">
            <button type="button" className="auth-alt-btn" onClick={goBack}>
              {step === 1 ? "Cancelar" : "Atrás"}
            </button>
            <button
              type="button"
              className="auth-primary registro-next-btn"
              onClick={() => void goNext()}
              disabled={saving}
            >
              {saving ? "Guardando…" : isLast ? lastLabel : "Continuar"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
