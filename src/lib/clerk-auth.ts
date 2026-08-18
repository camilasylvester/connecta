/** Shared helpers for Clerk email/password custom flows. */

/** Dark Connecta chrome, but Google's official button stays white + dark text. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#6f6ae0",
    colorBackground: "#0d0d10",
    colorInputBackground: "#111116",
    colorInputText: "#f4f3ef",
    colorText: "#f4f3ef",
    colorTextSecondary: "rgba(244, 243, 239, 0.56)",
    colorDanger: "#e0736b",
    colorNeutral: "#f4f3ef",
    borderRadius: "10px",
    fontFamily: "var(--font-inter), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none border-0 p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton: {
      backgroundColor: "#ffffff",
      color: "#1f1f1f",
      border: "1px solid #ffffff",
      boxShadow: "none",
    },
    socialButtonsBlockButtonText: {
      color: "#1f1f1f",
      fontWeight: "600",
    },
    formButtonPrimary: "bg-[#6f6ae0] hover:bg-[#9c98ec] text-white shadow-none",
    formFieldInput:
      "border border-[rgba(244,243,239,0.14)] bg-[#111116] text-[#f4f3ef]",
    footerActionLink: "text-[#9c98ec] hover:text-white",
    identityPreviewEditButton: "text-[#9c98ec]",
    formFieldLabel: "text-[rgba(244,243,239,0.56)]",
    dividerLine: "bg-[rgba(244,243,239,0.14)]",
    dividerText: "text-[rgba(244,243,239,0.56)]",
  },
} as const;

export function clerkErrorMessage(error: unknown, fallback = "Algo salió mal. Probá de nuevo."): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as {
    message?: string;
    errors?: Array<{ longMessage?: string; message?: string; code?: string }>;
    fields?: Record<string, { message?: string } | undefined>;
  };

  if (e.fields) {
    for (const field of Object.values(e.fields)) {
      if (field?.message) return field.message;
    }
  }

  const first = e.errors?.[0];
  const code = first?.code || "";
  const raw = first?.longMessage || first?.message || e.message || "";

  if (
    code === "session_exists" ||
    /already signed in/i.test(raw) ||
    /ya.*sesión/i.test(raw)
  ) {
    return "Ya tenés la sesión abierta. Entrá a la app y creá tu contraseña ahí, o cerrá sesión y volvé a intentar.";
  }

  if (
    code === "reverification_missing" ||
    code === "additional_verification_required" ||
    /additional verification/i.test(raw) ||
    /reverification/i.test(raw)
  ) {
    return "Por seguridad, Clerk pide confirmar tu identidad. Completá la verificación o usá “Preferís verificar por email”.";
  }

  if (
    code === "form_password_pwned" ||
    /data breach|encontrad[ao].*breach|compromised password/i.test(raw)
  ) {
    return "Esa contraseña apareció en filtraciones de datos. Elegí otra más segura.";
  }

  if (
    code === "form_identifier_exists" ||
    /already.?exist|ya.?exist|taken/i.test(raw)
  ) {
    return "Ese email ya tiene una cuenta. Probá iniciar sesión o crear una contraseña.";
  }

  if (
    code === "captcha_invalid" ||
    /captcha|bot validation|security validations/i.test(raw)
  ) {
    return "Clerk bloqueó el registro por seguridad (captcha). Recargá la página, desactivá bloqueadores o probá otro navegador / datos móviles.";
  }

  if (first?.longMessage) return first.longMessage;
  if (first?.message) return first.message;
  if (e.message) return e.message;
  return fallback;
}

export function afterAuthPath(next?: string | null): string {
  const params = next ? `?next=${encodeURIComponent(next)}` : "";
  return `/after-auth${params}`;
}
