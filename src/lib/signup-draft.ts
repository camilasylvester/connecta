import type { CreatorRegistroV3Draft } from "@/lib/creator-registro-v3";
import { normalizeInstagramHandle } from "@/lib/instagram";
import { emptyOnboarding, type OnboardingPayload } from "@/lib/onboarding";
import { formatArMobileDisplay } from "@/lib/phone";
import { TERMS_VERSION } from "@/lib/terms";

/**
 * Alta "perfil primero, cuenta después" (T-36).
 *
 * La ficha completa se llena ANTES de crear el acceso. Viaja por dos caminos:
 *
 * 1. Entera, en localStorage (`connecta-creator-draft` / `connecta-brand-draft`).
 *    `/completar-perfil` la sube con `syncOnboarding` apenas existe la cuenta.
 * 2. Solo el contacto, en `unsafeMetadata` de Clerk (ver `ensureProfile`).
 *    Es la red de seguridad: si el borrador local se pierde (otro navegador,
 *    storage bloqueado) la fila nace igual con nombre, celular y términos.
 *
 * La ficha completa no va entera a Clerk porque la metadata tiene un tope de
 * ~8 KB y un creador con muchas categorías se acerca a ese número.
 */
export type SignupMetadata = Record<string, string>;

/** Contacto mínimo del creador para `unsafeMetadata`. */
export function creatorDraftToSignupMetadata(
  draft: CreatorRegistroV3Draft
): SignupMetadata {
  const meta: SignupMetadata = {
    display_name: draft.nombre.trim(),
    phone: formatArMobileDisplay(draft.phone) || draft.phone.trim(),
    terms_accepted: "true",
    terms_version: TERMS_VERSION,
  };
  const handle = normalizeInstagramHandle(draft.instagram);
  if (handle) meta.handle = handle;
  return meta;
}

/** Contacto mínimo de la marca para `unsafeMetadata`. */
export function brandDraftToSignupMetadata(
  data: OnboardingPayload
): SignupMetadata {
  const meta: SignupMetadata = {
    display_name: data.brandName.trim(),
    brand_name: data.brandName.trim(),
    contact_name: data.contactPerson.trim(),
    phone: formatArMobileDisplay(data.phone) || data.phone.trim(),
    terms_accepted: "true",
    terms_version: TERMS_VERSION,
  };
  const handle = normalizeInstagramHandle(data.instagram);
  if (handle) meta.handle = handle;
  return meta;
}

export const BRAND_DRAFT_STORAGE_KEY = "connecta-brand-draft";

/** Guarda el borrador de marca en local + session (igual que el del creador). */
export function saveBrandDraft(data: OnboardingPayload) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(data);
  try {
    localStorage.setItem(BRAND_DRAFT_STORAGE_KEY, payload);
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.setItem(BRAND_DRAFT_STORAGE_KEY, payload);
  } catch {
    /* ignore */
  }
}

/** Devuelve el borrador de marca o null si no hay / está corrupto. */
export function loadBrandDraft(): OnboardingPayload | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw =
      sessionStorage.getItem(BRAND_DRAFT_STORAGE_KEY) ||
      localStorage.getItem(BRAND_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingPayload>;
    // Se parte de un payload vacío para que un borrador viejo o incompleto
    // nunca deje campos undefined que rompan la validación.
    const base = emptyOnboarding("brand");
    return {
      ...base,
      ...parsed,
      role: "brand",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    };
  } catch {
    return null;
  }
}

export function clearBrandDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BRAND_DRAFT_STORAGE_KEY);
    localStorage.removeItem(BRAND_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
