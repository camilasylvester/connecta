"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import {
  AuthProgress,
  AuthSelectCard,
  IconBrand,
  IconLogin,
  IconSignup,
  IconUser,
} from "@/components/AuthWizardBits";
import { LoginClerkSignIn } from "@/components/LoginClerkSignIn";
import { RegistroClerkSignUp } from "@/components/RegistroClerkSignUp";
import {
  persistAuthNext,
  persistAuthRole,
  type AuthProfileRole,
} from "@/lib/clerk-auth";

type AuthMode = "login" | "signup";
type AuthProfile = "creador" | "marca";
type WizardStep = "intent" | "role" | "access";

function buildHref(parts: {
  mode?: AuthMode | null;
  profile?: AuthProfile | null;
  next?: string;
  error?: string | null;
}): string {
  const params = new URLSearchParams();
  if (parts.mode === "signup") params.set("tab", "signup");
  if (parts.mode === "login") params.set("tab", "login");
  if (parts.profile) params.set("as", parts.profile);
  if (parts.next) params.set("next", parts.next);
  if (parts.error) params.set("error", parts.error);
  const qs = params.toString();
  return `/login${qs ? `?${qs}` : ""}`;
}

function profileToRole(profile: AuthProfile): AuthProfileRole {
  return profile === "marca" ? "brand" : "creator";
}

export function AuthEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut } = useAuth();
  const next = searchParams.get("next") || "";
  const idle = searchParams.get("idle") === "1";
  const errorParam = searchParams.get("error") || "";
  const expectedRole = searchParams.get("expected") || "";

  const tabParam = searchParams.get("tab");
  const asParam = searchParams.get("as") || searchParams.get("role");
  const isAdminLink = asParam === "admin";

  const initialMode: AuthMode | null =
    tabParam === "signup"
      ? "signup"
      : tabParam === "login"
        ? "login"
        : asParam
          ? "login"
          : null;
  const initialProfile: AuthProfile | null =
    asParam === "marca" || asParam === "brand"
      ? "marca"
      : asParam === "creador" || asParam === "creator"
        ? "creador"
        : null;

  const [mode, setMode] = useState<AuthMode | null>(initialMode);
  const [profile, setProfile] = useState<AuthProfile | null>(initialProfile);
  const [signingOut, setSigningOut] = useState(false);
  const [pickedIntent, setPickedIntent] = useState<AuthMode | null>(null);
  const [pickedProfile, setPickedProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    persistAuthNext(next);
  }, [next]);

  useEffect(() => {
    setMode(initialMode);
    setProfile(initialProfile);
  }, [initialMode, initialProfile]);

  const step: WizardStep =
    !mode ? "intent" : !profile && !isAdminLink ? "role" : "access";

  const roleMismatch = errorParam === "role_mismatch";

  const roleMismatchCopy = useMemo(() => {
    if (!roleMismatch) return null;
    if (expectedRole === "brand" || expectedRole === "marca") {
      return "Esta cuenta es de marca. Para entrar, elegí Iniciar sesión → Marca.";
    }
    if (expectedRole === "creator" || expectedRole === "creador") {
      return "Esta cuenta es de creador. Para entrar, elegí Iniciar sesión → Creador.";
    }
    return "Elegiste un tipo de cuenta que no coincide con esta sesión. Volvé a intentar por el camino correcto.";
  }, [roleMismatch, expectedRole]);

  function go(parts: {
    mode?: AuthMode | null;
    profile?: AuthProfile | null;
    clearError?: boolean;
  }) {
    router.replace(
      buildHref({
        mode: parts.mode === undefined ? mode : parts.mode,
        profile: parts.profile === undefined ? profile : parts.profile,
        next,
        error: parts.clearError ? null : errorParam || null,
      }),
      { scroll: false }
    );
  }

  function chooseIntent(nextMode: AuthMode) {
    if (pickedIntent) return;
    setPickedIntent(nextMode);
    window.setTimeout(() => {
      setMode(nextMode);
      setProfile(null);
      persistAuthRole(null);
      go({ mode: nextMode, profile: null, clearError: true });
      setPickedIntent(null);
    }, 220);
  }

  function chooseProfile(nextProfile: AuthProfile) {
    if (pickedProfile) return;
    setPickedProfile(nextProfile);
    window.setTimeout(() => {
      setProfile(nextProfile);
      persistAuthRole(profileToRole(nextProfile));
      go({ mode, profile: nextProfile, clearError: true });
      setPickedProfile(null);
    }, 220);
  }

  function goBack() {
    if (step === "access") {
      setProfile(null);
      persistAuthRole(null);
      go({ mode, profile: null, clearError: true });
      return;
    }
    if (step === "role") {
      setMode(null);
      setProfile(null);
      go({ mode: null, profile: null, clearError: true });
    }
  }

  if (roleMismatch) {
    return (
      <AuthFrame
        eyebrow=""
        title="Camino incorrecto"
        description={roleMismatchCopy || ""}
        showMobileTitle
      >
        <button
          type="button"
          className="auth-primary"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut({
                redirectUrl: buildHref({
                  mode: "login",
                  profile:
                    expectedRole === "brand" || expectedRole === "marca"
                      ? "marca"
                      : expectedRole === "creator" || expectedRole === "creador"
                        ? "creador"
                        : null,
                  next,
                }),
              });
            } finally {
              setSigningOut(false);
            }
          }}
        >
          {signingOut ? "Cerrando…" : "Cerrar sesión y corregir"}
        </button>
        <p className="auth-switch">
          <button
            type="button"
            onClick={() => {
              router.replace(buildHref({ mode: null, profile: null, next }));
            }}
          >
            Volver al inicio
          </button>
        </p>
      </AuthFrame>
    );
  }

  if (step === "intent") {
    return (
      <AuthFrame
        eyebrow=""
        title="Bienvenido a Connecta"
        description={
          idle
            ? "Cerramos tu sesión por inactividad. Volvé a entrar para continuar."
            : "Elegí cómo querés continuar."
        }
        showMobileTitle
      >
        <div className="auth-select-grid auth-select-grid--intent">
          <AuthSelectCard
            title="Iniciar sesión"
            description="Ya tengo cuenta en Connecta."
            icon={<IconLogin />}
            selected={pickedIntent === "login"}
            onClick={() => chooseIntent("login")}
          />
          <AuthSelectCard
            title="Crear cuenta"
            description="Primera vez: armamos tu acceso y después el perfil."
            icon={<IconSignup />}
            selected={pickedIntent === "signup"}
            onClick={() => chooseIntent("signup")}
          />
        </div>
        <p className="auth-wizard-foot">Empezá eligiendo una opción.</p>
      </AuthFrame>
    );
  }

  if (step === "role") {
    return (
      <AuthFrame
        eyebrow=""
        title={mode === "login" ? "¿Cómo iniciás sesión?" : "¿Cómo vas a usar Connecta?"}
        description={
          mode === "login"
            ? "Elegí el tipo de cuenta con el que te registraste."
            : "Así armamos el espacio correcto para vos."
        }
        showMobileTitle
        progress={
          mode === "login" ? (
            <AuthProgress total={2} current={1} labels={["Tipo de cuenta", "Acceso"]} />
          ) : undefined
        }
        onBack={goBack}
      >
        <div className="auth-select-grid">
          <AuthSelectCard
            title="Creador"
            description="Postulate a eventos y colaborá con marcas."
            icon={<IconUser />}
            selected={pickedProfile === "creador"}
            onClick={() => chooseProfile("creador")}
          />
          <AuthSelectCard
            title="Marca"
            description="Publicá acciones y encontrá creadores."
            icon={<IconBrand />}
            selected={pickedProfile === "marca"}
            onClick={() => chooseProfile("marca")}
          />
        </div>
        <p className="auth-wizard-foot">
          {mode === "login"
            ? "Después vas a entrar con Google o email."
            : "Después creás el acceso; el perfil viene después."}
        </p>
      </AuthFrame>
    );
  }

  // access
  const role = profile ? profileToRole(profile) : "creator";
  return (
    <AuthFrame
      eyebrow=""
      title={mode === "login" ? "Tu acceso" : "Creá tu acceso"}
      description={
        mode === "login"
          ? profile === "marca"
            ? "Entrá con Google o el email de tu marca."
            : isAdminLink
              ? "Entrá con Google o el email de admin."
              : "Entrá con Google o tu email."
          : profile === "marca"
            ? "Google o email. Después completás los datos de la marca."
            : "Google o email. Después armamos tu perfil de creador."
      }
      showMobileTitle
      progress={
        mode === "login" && !isAdminLink ? (
          <AuthProgress total={2} current={2} labels={["Tipo de cuenta", "Acceso"]} />
        ) : undefined
      }
      onBack={isAdminLink ? undefined : goBack}
    >
      {mode === "login" ? (
        <LoginClerkSignIn next={next} role={role} />
      ) : (
        <RegistroClerkSignUp role={role} next={next} />
      )}
      <p className="auth-switch">
        {mode === "login" ? "¿Primera vez en Connecta? " : "¿Ya tenés cuenta? "}
        <button
          type="button"
          onClick={() => {
            const other: AuthMode = mode === "login" ? "signup" : "login";
            setMode(other);
            go({ mode: other, profile, clearError: true });
          }}
        >
          {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </p>
    </AuthFrame>
  );
}
