"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getLoginEmailByHandle } from "@/app/login/actions";
import { AuthFrame } from "@/components/AuthFrame";
import { EmailPasswordSignIn } from "@/components/EmailPasswordSignIn";
import { LoginClerkSignIn } from "@/components/LoginClerkSignIn";
import { RegistroClerkSignUp } from "@/components/RegistroClerkSignUp";
import { persistAuthNext } from "@/lib/clerk-auth";
import { instagramUrl, normalizeInstagramHandle } from "@/lib/instagram";
import { TERMS_VERSION } from "@/lib/terms";
import { TermsAcceptCheckbox } from "@/components/TermsAcceptCheckbox";

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
    searchParams.get("as") === "marca" || searchParams.get("role") === "brand"
      ? "marca"
      : "creador";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [profile, setProfile] = useState<AuthProfile>(initialProfile);
  const [instagram, setInstagram] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentialsEmail, setCredentialsEmail] = useState<string | null>(null);
  const [emailLogin, setEmailLogin] = useState(false);
  const [brandSignup, setBrandSignup] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    persistAuthNext(next);
  }, [next]);

  const igUrl = useMemo(
    () => instagramUrl(instagram),
    [instagram]
  );

  const copy = useMemo(() => {
    return {
      title: "Bienvenido a Connecta",
      eyebrow: "",
      sub: "",
    };
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setCredentialsEmail(null);
    setEmailLogin(false);
    setBrandSignup(false);
    router.replace(buildHref(nextMode, profile, next), { scroll: false });
  }

  function switchProfile(nextProfile: AuthProfile) {
    setProfile(nextProfile);
    setError(null);
    setCredentialsEmail(null);
    setEmailLogin(false);
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
      if (!termsAccepted) {
        setError("Tenés que aceptar los Términos y la Política de privacidad.");
        return;
      }
      try {
        sessionStorage.setItem("connecta-terms-accepted", "1");
      } catch {
        /* ignore */
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
      if (!termsAccepted) {
        setError("Tenés que aceptar los Términos y la Política de privacidad.");
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

  if (emailLogin) {
    return (
      <AuthFrame
        eyebrow=""
        title="Bienvenido a Connecta"
        description="Seguís como creador o marca, según lo que elegiste."
        showMobileTitle
      >
        <button
          type="button"
          className="auth-secondary"
          style={{ marginBottom: 18 }}
          onClick={() => setEmailLogin(false)}
        >
          ← Volver
        </button>
        <LoginClerkSignIn next={next} />
      </AuthFrame>
    );
  }

  if (credentialsEmail) {
    return (
      <AuthFrame
        eyebrow=""
        title="Bienvenido a Connecta"
        description={`Vas a entrar con ${credentialsEmail}.`}
        showMobileTitle
      >
        <button
          type="button"
          className="auth-secondary"
          style={{ marginBottom: 18 }}
          onClick={() => setCredentialsEmail(null)}
        >
          ← Volver
        </button>
        <EmailPasswordSignIn
          next={next}
          initialEmail={credentialsEmail}
          passwordOnly
        />
      </AuthFrame>
    );
  }

  if (brandSignup) {
    return (
      <AuthFrame
        eyebrow=""
        title="Bienvenido a Connecta"
        description={`Creá el acceso de ${brandName.trim()}. Después completás el perfil.`}
        showMobileTitle
      >
        <button
          type="button"
          className="auth-secondary"
          style={{ marginBottom: 18 }}
          onClick={() => setBrandSignup(false)}
        >
          ← Volver
        </button>
        <RegistroClerkSignUp
          role="brand"
          next={next}
          initialEmail={email}
          extraMetadata={{
            brand_name: brandName.trim(),
            terms_accepted: "true",
            terms_version: TERMS_VERSION,
          }}
        />
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
      <div className="auth-flow-controls">
        <div className="auth-profile-block">
          <div className="auth-profile-grid" role="group" aria-label="Tipo de cuenta">
            <button
              type="button"
              className={`auth-profile-card${profile === "creador" ? " is-selected" : ""}`}
              onClick={() => switchProfile("creador")}
            >
              <strong className="auth-profile-name">Creador</strong>
            </button>
            <button
              type="button"
              className={`auth-profile-card${profile === "marca" ? " is-selected" : ""}`}
              onClick={() => switchProfile("marca")}
            >
              <strong className="auth-profile-name">Marca</strong>
            </button>
          </div>
        </div>

        <div className="auth-tabs" role="group" aria-label="Acción">
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

        {mode === "signup" ? (
          <div className="auth-field">
            <TermsAcceptCheckbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
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

      {profile === "creador" && mode === "login" ? (
        <>
          <div className="auth-divider">o</div>
          <button
            type="button"
            className="auth-alt-btn"
            onClick={() => {
              setError(null);
              setEmailLogin(true);
            }}
          >
            Continuar con email
          </button>
        </>
      ) : null}

      <p className="auth-switch">
        {mode === "login" ? "¿Primera vez en Connecta? " : "¿Ya tenés cuenta? "}
        <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </p>
    </AuthFrame>
  );
}
