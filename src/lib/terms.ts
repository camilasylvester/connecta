/** Versión legal vigente. Subir a v2, v3… cuando cambien /terminos o /privacidad. */
export const TERMS_VERSION = "v1";

export const TERMS_PATH = "/terminos";
export const PRIVACY_PATH = "/privacidad";

export function profileHasAcceptedTerms(profile: {
  termsAcceptedAt: Date | null;
}): boolean {
  return Boolean(profile.termsAcceptedAt);
}
