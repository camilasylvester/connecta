"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { getLoginEmailByHandle } from "@/app/login/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { EmailPasswordSignIn } from "@/components/EmailPasswordSignIn";
import { RegistroClerkSignUp } from "@/components/RegistroClerkSignUp";
import { instagramUrl, normalizeInstagramHandle } from "@/lib/instagram";

type AuthMode = "login" | "signup";
type AuthProfile = "creador" | "marca";

function buildHref(
  mode: AuthMode,
  profile: AuthProfile,
  next: string
): string {
  const params = new URLSearchParams();
  params.set("tab", mode === "signup" ? "signup" : "login");
  params.set("as", profile);
  if (next) params.set("next", next);
  return `/login?${params.toString()}`;
}

export function AuthEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const idle = searchParams.get("idle") === "1";

  const initialMode: AuthMode =
    searchParams.get("tab") === "signup" ? "signup" : "login";
  const initialProfile: AuthProfile =
    searchParams.get("as") === "marca" ? "marca" : "creador";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [profile, setProfile] = useState<AuthProfile>(initialProfile);
  const [instagram, setInstagram] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentialsEmail, setCredentialsEmail] = useState<string | null>(null);
  const [brandSignup, setBrandSignup] = useState(false);

  const igUrl = useMemo(
    () => instagramUrl(instagram),
    [instagram]
  );

  const copy = useMemo(() => {
    if (mode === "login") {
      return {
        eyebrow: "Iniciar sesión",
        title: "Iniciá sesión",
        sub:
          profile === "creador"
            ? "Iniciá sesión con tu Instagram."
            : "Iniciá sesión con el email de tu marca.",
      };
    }
    return {
      eyebrow: "Nueva cuenta",
      title: "Creá tu cuenta",
      sub:
        profile === "creador"
          ? "Creá tu perfil de creador con tu Instagram."
          : "Creá la cuenta de tu marca con tu email.",
    };
  }, [mode, profile]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setCredentialsEmail(null);
    setBrandSignup(false);
    router.replace(buildHref(nextMode, profile, next), { scroll: false });
  }

  function switchProfile(nextProfile: AuthProfile) {
    setProfile(nextProfile);
    setError(null);
    setCredentialsEmail(null);
    setBrandSignup(false);
    router.replace(buildHref(mode, nextProfile, next), { scroll: false });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && profile === "creador") {
      const handle = normalizeInstagramHandle(instagram);
      if (!handle) {
        setError("Escribí tu usuario de Instagram.");
        return;
      }
      const params = new URLSearchParams();
      params.set("instagram", handle);
      if (next) params.set("next", next);
      router.push(`/registro/creador?${params.toString()}`);
      return;
    }

    if (mode === "signup" && profile === "marca") {
      if (!brandName.trim()) {
        setError("Escribí el nombre de la marca.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Escribí un email válido.");
        return;
      }
      setBrandSignup(true);
      return;
    }

    if (mode === "login" && profile === "creador") {
      const handle = normalizeInstagramHandle(instagram);
      if (!handle) {
        setError("Escribí tu usuario de Instagram.");
        return;
      }
      setLoading(true);
      try {
        const lookup = await getLoginEmailByHandle(handle);
        if (!lookup?.email) {
          setError("No encontramos una cuenta con ese Instagram.");
          return;
        }
        setCredentialsEmail(lookup.email);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "login" && profile === "marca") {
      if (!email.trim() || !email.includes("@")) {
        setError("Escribí el email de tu marca.");
        return;
      }
      setCredentialsEmail(email.trim().toLowerCase());
    }
  }

  if (credentialsEmail) {
    return (
      <AuthFrame
        eyebrow="Iniciar sesión"
        title="Ingresá tu contraseña"
        description={`Continuá como ${credentialsEmail}`}
      >
        <button
          type="button"
          className="auth-secondary"
          style={{ marginBottom: 18 }}
          onClick={() => setCredentialsEmail(null)}
        >
          ← Volver
        </button>
        <EmailPasswordSignIn next={next} initialEmail={credentialsEmail} />
      </AuthFrame>
    );
  }

  if (brandSignup) {
    return (
      <AuthFrame
        eyebrow="Nueva cuenta"
        title="Email y contraseña"
        description={`Creá el acceso de ${brandName.trim()}. Después completás el perfil.`}
      >
        <button
          type="button"
          className="auth-secondary"
          style={{ marginBottom: 18 }}
          onClick={() => setBrandSignup(false)}
        >
          ← Volver
        </button>
        <RegistroClerkSignUp role="brand" next={next} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={
        idle
          ? "Cerramos tu sesión por inactividad. Volvé a entrar para continuar."
          : copy.sub
      }
    >
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab${mode === "login" ? " is-active" : ""}`}
          onClick={() => switchMode("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={`auth-tab${mode === "signup" ? " is-active" : ""}`}
          onClick={() => switchMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <span className="auth-profile-label">Sos...</span>
      <div className="auth-profile-grid">
        <button
          type="button"
          className={`auth-profile-card${profile === "creador" ? " is-selected" : ""}`}
          onClick={() => switchProfile("creador")}
        >
          <span className="auth-profile-icon" aria-hidden />
          <strong className="auth-profile-name">Creador</strong>
          <span className="auth-profile-desc">
            Postulate a eventos y campañas de marcas.
          </span>
        </button>
        <button
          type="button"
          className={`auth-profile-card${profile === "marca" ? " is-selected" : ""}`}
          onClick={() => switchProfile("marca")}
        >
          <span className="auth-profile-icon" aria-hidden />
          <strong className="auth-profile-name">Marca</strong>
          <span className="auth-profile-desc">
            Publicá eventos y encontrá creadores.
          </span>
        </button>
      </div>

      <form className="auth-v3-form" onSubmit={onSubmit}>
        {profile === "creador" ? (
          <div className="auth-field">
            <label htmlFor="instagram">Tu Instagram</label>
            <input
              id="instagram"
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@tu.usuario"
              autoComplete="off"
            />
            <p className="auth-hint">
              {igUrl ? (
                <>
                  Tu perfil:{" "}
                  <Link href={igUrl} target="_blank" rel="noreferrer">
                    {igUrl.replace("https://", "")}
                  </Link>
                </>
              ) : (
                "Escribí tu usuario y te mostramos el link a tu perfil."
              )}
            </p>
          </div>
        ) : null}

        {profile === "marca" && mode === "signup" ? (
          <div className="auth-field">
            <label htmlFor="brandName">Nombre de la marca</label>
            <input
              id="brandName"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Costa 7070"
              autoComplete="off"
            />
          </div>
        ) : null}

        {profile === "marca" ? (
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hola@tumarca.com"
              autoComplete="email"
            />
          </div>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-primary" disabled={loading}>
          {loading
            ? "Buscando…"
            : mode === "login"
              ? "Iniciar sesión"
              : "Continuar"}
        </button>
      </form>

      <div className="auth-divider">o</div>
      <button
        type="button"
        className="auth-alt-btn"
        onClick={() =>
          switchProfile(profile === "creador" ? "marca" : "creador")
        }
      >
        {profile === "creador" ? "Continuar con email" : "Continuar con Instagram"}
      </button>

      <p className="auth-switch">
        {mode === "login" ? "¿Primera vez en Connecta? " : "¿Ya tenés cuenta? "}
        <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </p>
    </AuthFrame>
  );
}
