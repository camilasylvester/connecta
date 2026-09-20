"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { clerkErrorMessage } from "@/lib/clerk-auth";

/** Starts Clerk email-code factor (OTP) from the current identifier field. */
export function PreferEmailCodeLink() {
  const { isLoaded, signIn } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!isLoaded || !signIn || busy) return;
    setError(null);
    const input = document.querySelector(
      '.auth-access-form input[name="identifier"], .auth-access-form input[type="email"], .auth-access-form input[name="emailAddress"]'
    ) as HTMLInputElement | null;
    const email = (input?.value || "").trim();
    if (!email || !email.includes("@")) {
      setError("Escribí tu email arriba y después pedí el código.");
      input?.focus();
      return;
    }

    setBusy(true);
    try {
      const created = await signIn.create({ identifier: email });
      const emailCode = created.supportedFirstFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (!emailCode || emailCode.strategy !== "email_code") {
        setError(
          "El ingreso con código no está disponible para esta cuenta. Usá contraseña o Google."
        );
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCode.emailAddressId,
      });
      window.location.hash = "#/factor-one";
    } catch (err) {
      setError(clerkErrorMessage(err, "No se pudo enviar el código."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-access-code">
      <button
        type="button"
        className="auth-access-code-link"
        onClick={() => void onClick()}
        disabled={busy || !isLoaded}
      >
        {busy ? "Enviando código…" : "Prefiero ingresar con un código"}
      </button>
      {error ? <p className="auth-error auth-access-code-error">{error}</p> : null}
    </div>
  );
}
