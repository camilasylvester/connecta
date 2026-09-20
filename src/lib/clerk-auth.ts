/** Shared helpers for Clerk email/password custom flows. */

/** Dark Connecta chrome, but Google's official button stays white + dark text. */
export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
    showOptionalFields: false,
    termsPageUrl: "/terminos",
    privacyPageUrl: "/privacidad",
  },
  variables: {
    colorPrimary: "#6f6ae0",
    colorBackground: "transparent",
    colorInputBackground: "#121218",
    colorInputText: "#f4f3ef",
    colorText: "#f4f3ef",
    colorTextOnPrimaryBackground: "#ffffff",
    colorTextSecondary: "rgba(244, 243, 239, 0.62)",
    colorDanger: "#e0736b",
    colorNeutral: "#f4f3ef",
    borderRadius: "12px",
    fontFamily: "var(--font-inter), sans-serif",
  },
  elements: {
    rootBox: "w-full mx-auto",
    cardBox: "w-full bg-transparent shadow-none border-0",
    card: "bg-transparent shadow-none border-0 p-0",
    main: "gap-4",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    identityPreview: "hidden",
    identityPreviewText: "text-[#f4f3ef]",
    identityPreviewIdentifier: "text-[#f4f3ef]",
    footer: "hidden",
    footerAction: "hidden",
    badge: {
      color: "rgba(244, 243, 239, 0.7)",
      backgroundColor: "rgba(111, 106, 224, 0.18)",
      borderColor: "rgba(156, 152, 236, 0.35)",
    },
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
    formButtonPrimary: {
      backgroundColor: "#6f6ae0",
      color: "#ffffff",
      boxShadow: "none",
      borderRadius: "12px",
    },
    formFieldInput: {
      color: "#f4f3ef",
      backgroundColor: "#121218",
      borderColor: "rgba(244, 243, 239, 0.18)",
      caretColor: "#f4f3ef",
      borderRadius: "12px",
    },
    formFieldLabel: {
      color: "rgba(244, 243, 239, 0.72)",
    },
    formFieldHintText: {
      color: "rgba(244, 243, 239, 0.5)",
    },
    formFieldAction: {
      color: "#9c98ec",
    },
    formFieldInputShowPasswordButton: {
      color: "rgba(244, 243, 239, 0.62)",
    },
    footerActionLink: {
      color: "#9c98ec",
    },
    identityPreviewEditButton: {
      color: "#9c98ec",
    },
    dividerLine: {
      backgroundColor: "rgba(244, 243, 239, 0.14)",
    },
    dividerText: {
      color: "rgba(244, 243, 239, 0.56)",
    },
    alternativeMethodsBlockButton: {
      color: "rgba(244, 243, 239, 0.72)",
      backgroundColor: "transparent",
      borderColor: "rgba(244, 243, 239, 0.18)",
    },
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

export type AuthProfileRole = "creator" | "brand";

export function afterAuthPath(
  next?: string | null,
  role?: AuthProfileRole | null
): string {
  const params = new URLSearchParams();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next);
  }
  if (role === "brand") params.set("as", "marca");
  if (role === "creator") params.set("as", "creador");
  const qs = params.toString();
  return `/after-auth${qs ? `?${qs}` : ""}`;
}

const AUTH_NEXT_KEY = "connecta_auth_next";
const AUTH_ROLE_KEY = "connecta_auth_role";

export function persistAuthNext(next?: string | null): void {
  if (typeof window === "undefined") return;
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    window.sessionStorage.setItem(AUTH_NEXT_KEY, next);
  } else {
    window.sessionStorage.removeItem(AUTH_NEXT_KEY);
  }
}

export function readAuthNext(): string {
  if (typeof window === "undefined") return "";
  const next = window.sessionStorage.getItem(AUTH_NEXT_KEY) || "";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "";
}

export function persistAuthRole(role?: AuthProfileRole | null): void {
  if (typeof window === "undefined") return;
  if (role === "creator" || role === "brand") {
    window.sessionStorage.setItem(AUTH_ROLE_KEY, role);
  } else {
    window.sessionStorage.removeItem(AUTH_ROLE_KEY);
  }
}

export function readAuthRole(): AuthProfileRole | "" {
  if (typeof window === "undefined") return "";
  const role = window.sessionStorage.getItem(AUTH_ROLE_KEY) || "";
  if (role === "creator" || role === "brand") return role;
  return "";
}

export function roleFromAsParam(as?: string | null): AuthProfileRole | null {
  if (as === "marca" || as === "brand") return "brand";
  if (as === "creador" || as === "creator") return "creator";
  return null;
}
