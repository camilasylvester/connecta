"use client";

import { useState } from "react";

/**
 * Tries to open Clerk's built-in email-code / alternative methods UI.
 * Avoids the Clerk 7 Future SignIn API surface (no prepareFirstFactor).
 */
export function PreferEmailCodeLink() {
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    const root = document.querySelector(".auth-access-form");
    if (!root) {
      setError("Completá el email y Continuá; después podés elegir el código.");
      return;
    }

    const candidates = Array.from(
      root.querySelectorAll("button, a")
    ) as HTMLElement[];
    const alt = candidates.find((el) =>
      /otro método|another method|código|email code|use (?:email )?code|usar (?:el )?código/i.test(
        el.textContent || ""
      )
    );
    if (alt) {
      alt.click();
      return;
    }

    setError(
      "Escribí tu email, tocá Continuar y en el siguiente paso elegí ingresar con código (si está habilitado)."
    );
  }

  return (
    <div className="auth-access-code">
      <button type="button" className="auth-access-code-link" onClick={onClick}>
        Prefiero ingresar con un código
      </button>
      {error ? <p className="auth-error auth-access-code-error">{error}</p> : null}
    </div>
  );
}
