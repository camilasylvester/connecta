"use client";

import { useAuth, useSignIn, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getLoginAccountHint } from "@/app/login/actions";
import { afterAuthPath, clerkErrorMessage } from "@/lib/clerk-auth";

type Mode = "signin" | "set-password";

export function EmailPasswordSignIn({
  next = "",
}: {
  next?: string;
}) {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("setPassword") === "1" ? "set-password" : "signin"
  );
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [checkingHint, setCheckingHint] = useState(false);
  const busy = fetchStatus === "fetching" || signingOut || checkingHint;

  const fieldError =
    errors?.fields?.identifier?.message ||
    errors?.fields?.password?.message ||
    errors?.fields?.code?.message ||
    null;

  // Prefill email from Clerk once, but keep the field editable.
  useEffect(() => {
    if (!userLoaded || !user || email) return;
    const fromClerk =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    if (fromClerk) setEmail(fromClerk);
  }, [userLoaded, user, email]);

  /** Already logged in with password → app. Without password → stay and ask email. */
  useEffect(() => {
    if (!authLoaded || !userLoaded || !isSignedIn || !user) return;
    if (searchParams.get("setPassword") === "1") return;
    if (!user.passwordEnabled) return;
    router.replace(afterAuthPath(next || null));
  }, [authLoaded, userLoaded, isSignedIn, user, router, next, searchParams]);

  async function beginPasswordSetupWithEmail(emailAddr: string) {
    const trimmed = emailAddr.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setLocalError("Escribí tu email para continuar.");
      return;
    }
    setLocalError(null);
    setSigningOut(true);
    const q = new URLSearchParams({
      setPassword: "1",
      email: trimmed,
      next: next || "/after-auth",
    });
    try {
      if (isSignedIn) {
        await signOut({ redirectUrl: `/login?${q.toString()}` });
      } else {
        setMode("set-password");
        setEmail(trimmed);
        setPassword("");
        setConfirm("");
        setCode("");
        setCodeSent(false);
        setSigningOut(false);
        router.replace(`/login?${q.toString()}`);
      }
    } catch (err) {
      setLocalError(clerkErrorMessage(err));
      setSigningOut(false);
    }
  }

  async function accountStatusMessage(emailAddr: string): Promise<string | null> {
    const hint = await getLoginAccountHint(emailAddr);
    if (!hint) return null;
    if (hint.accountStatus === "pending") {
      return "Tu solicitud todavía no fue aprobada. Cuando el equipo de CONNECTA la acepte, vas a poder entrar.";
    }
    if (hint.accountStatus === "rejected") {
      return "Tu solicitud no fue aprobada. Si creés que es un error, escribinos.";
    }
    return null;
  }

  async function clerkAccountNeedsPassword(emailAddr: string): Promise<boolean> {
    try {
      signIn.reset?.();
    } catch {
      /* ignore */
    }
    const { error } = await signIn.create({ identifier: emailAddr });
    if (error) return false;
    const factors = signIn.supportedFirstFactors || [];
    return !factors.some((f) => f.strategy === "password");
  }

  async function messageForFailedSignIn(emailAddr: string): Promise<string> {
    setCheckingHint(true);
    try {
      const statusMsg = await accountStatusMessage(emailAddr);
      if (statusMsg) return statusMsg;

      const needsPassword = await clerkAccountNeedsPassword(emailAddr);
      if (needsPassword) {
        return "Ya tenés una cuenta, pero todavía no creaste una contraseña. Usá el botón de abajo: Tenés que crear una contraseña.";
      }

      return "Email o contraseña incorrectos.";
    } catch {
      return "Email o contraseña incorrectos.";
    } finally {
      setCheckingHint(false);
    }
  }

  async function finalizeAndGo() {
    const { error } = await signIn.finalize({
      navigate: async () => {
        router.push(afterAuthPath(next || null));
      },
    });
    if (error) {
      setLocalError(clerkErrorMessage(error));
      return;
    }
    router.push(afterAuthPath(next || null));
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (isSignedIn) {
      if (user && !user.passwordEnabled) {
        await beginPasswordSetupWithEmail(email);
        return;
      }
      router.replace(afterAuthPath(next || null));
      return;
    }

    if (!email.trim()) {
      setLocalError("Escribí tu email.");
      return;
    }
    if (!password) {
      setLocalError("Escribí tu contraseña.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { error } = await signIn.password({
      emailAddress: trimmedEmail,
      password,
    });
    if (error) {
      setLocalError(await messageForFailedSignIn(trimmedEmail));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndGo();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
        setCodeSent(true);
        setLocalError(null);
        return;
      }
    }

    setLocalError(
      "No pudimos completar el ingreso. Si todavía no tenés contraseña, creala abajo."
    );
  }

  async function onVerifyTrust(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setLocalError(clerkErrorMessage(error, "Código inválido."));
      return;
    }
    if (signIn.status === "complete") {
      await finalizeAndGo();
    }
  }

  async function sendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setLocalError("Escribí tu email para enviarte el código.");
      return;
    }

    if (isSignedIn) {
      await beginPasswordSetupWithEmail(trimmed);
      return;
    }

    const { error: createError } = await signIn.create({
      identifier: trimmed,
    });
    if (createError) {
      setLocalError(clerkErrorMessage(createError, "No encontramos esa cuenta."));
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setLocalError(
        clerkErrorMessage(
          sendError,
          "No pudimos enviar el código. Revisá el email."
        )
      );
      return;
    }

    setEmail(trimmed);
    setCodeSent(true);
  }

  async function verifyResetCode(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) {
      setLocalError(clerkErrorMessage(error, "Código inválido."));
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });
    if (error) {
      setLocalError(clerkErrorMessage(error));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndGo();
    }
  }

  function switchToSetPassword() {
    setMode("set-password");
    setPassword("");
    setConfirm("");
    setCode("");
    setCodeSent(false);
    setLocalError(null);
  }

  function switchToSignIn() {
    setMode("signin");
    setPassword("");
    setConfirm("");
    setCode("");
    setCodeSent(false);
    setLocalError(null);
    signIn.reset?.();
  }

  const displayError = localError || fieldError;
  const needsFirstPassword =
    Boolean(isSignedIn && user && !user.passwordEnabled) &&
    searchParams.get("setPassword") !== "1";

  if (!authLoaded || !userLoaded) {
    return (
      <p className="auth-hint" style={{ marginTop: 0, textAlign: "center" }}>
        Cargando…
      </p>
    );
  }

  if (needsFirstPassword) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void beginPasswordSetupWithEmail(email);
        }}
      >
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Ya tenés una cuenta, pero <strong>tenés que crear una contraseña</strong>{" "}
          para poder entrar. Confirmá tu email y te mandamos un código.
        </p>
        <label>
          <span className="auth-field-label">Tu email</span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="vos@email.com"
          />
        </label>
        {displayError ? <p className="auth-error">{displayError}</p> : null}
        <button
          type="submit"
          className="auth-primary"
          disabled={busy || !email.trim()}
        >
          {busy ? "Continuando…" : "Crear mi contraseña"}
        </button>
      </form>
    );
  }

  if (isSignedIn && user?.passwordEnabled) {
    return (
      <p className="auth-hint" style={{ marginTop: 0, textAlign: "center" }}>
        Ya estás adentro. Redirigiendo…
      </p>
    );
  }

  if (mode === "set-password") {
    return (
      <div>
        <button
          type="button"
          onClick={switchToSignIn}
          className="auth-secondary"
          style={{ marginBottom: 18 }}
        >
          ← Volver al inicio de sesión
        </button>

        {!codeSent ? (
          <form onSubmit={sendResetCode}>
            <p className="auth-hint" style={{ marginTop: 0 }}>
              Paso 1: escribí el <strong>email de tu cuenta</strong>. Te
              mandamos un código para crear la contraseña.
            </p>
            <label>
              <span className="auth-field-label">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="vos@email.com"
              />
            </label>
            {displayError ? <p className="auth-error">{displayError}</p> : null}
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="auth-primary"
            >
              {busy ? "Enviando…" : "Enviar código"}
            </button>
          </form>
        ) : signIn.status !== "needs_new_password" ? (
          <form onSubmit={verifyResetCode}>
            <p className="auth-hint" style={{ marginTop: 0 }}>
              Paso 2: ingresá el código que enviamos a{" "}
              <strong>{email || "tu email"}</strong>.
            </p>
            <label>
              <span className="auth-field-label">Código</span>
              <input
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="auth-input"
                placeholder="123456"
              />
            </label>
            {displayError ? <p className="auth-error">{displayError}</p> : null}
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="auth-primary"
            >
              {busy ? "Verificando…" : "Verificar código"}
            </button>
            <button
              type="button"
              className="auth-secondary"
              style={{ display: "block", margin: "16px auto 0" }}
              onClick={() => signIn.resetPasswordEmailCode.sendCode()}
              disabled={busy}
            >
              Reenviar código
            </button>
            <button
              type="button"
              className="auth-secondary"
              style={{ display: "block", margin: "8px auto 0" }}
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setLocalError(null);
              }}
              disabled={busy}
            >
              Cambiar email
            </button>
          </form>
        ) : (
          <form onSubmit={submitNewPassword}>
            <p className="auth-hint" style={{ marginTop: 0 }}>
              Paso 3: elegí tu nueva contraseña para{" "}
              <strong>{email || "tu cuenta"}</strong>.
            </p>
            <label>
              <span className="auth-field-label">Nueva contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            <label style={{ display: "block", marginTop: 14 }}>
              <span className="auth-field-label">Repetir contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="auth-input"
              />
            </label>
            {displayError ? <p className="auth-error">{displayError}</p> : null}
            <button type="submit" disabled={busy} className="auth-primary">
              {busy ? "Guardando…" : "Guardar contraseña y entrar"}
            </button>
          </form>
        )}
      </div>
    );
  }

  if (codeSent && signIn.status === "needs_client_trust") {
    return (
      <form onSubmit={onVerifyTrust}>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Por seguridad, confirmá el código que enviamos a tu email.
        </p>
        <label>
          <span className="auth-field-label">Código</span>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="auth-input"
          />
        </label>
        {displayError ? <p className="auth-error">{displayError}</p> : null}
        <button type="submit" disabled={busy} className="auth-primary">
          {busy ? "Verificando…" : "Verificar"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSignIn}>
      <label>
        <span className="auth-field-label">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="vos@email.com"
        />
      </label>
      <label style={{ display: "block", marginTop: 14 }}>
        <span className="auth-field-label">Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          placeholder="Tu contraseña"
        />
      </label>
      {displayError ? <p className="auth-error">{displayError}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="auth-primary"
      >
        {busy ? "Entrando…" : "Iniciar sesión"}
      </button>
      <button
        type="button"
        className="auth-secondary"
        style={{ display: "block", margin: "18px auto 0" }}
        onClick={switchToSetPassword}
      >
        Tenés que crear una contraseña
      </button>
      <p className="auth-hint" style={{ textAlign: "center", marginTop: 10 }}>
        Si es tu primera vez entrando o no recordás la contraseña, creala acá.
      </p>
      <div id="clerk-captcha" />
    </form>
  );
}
