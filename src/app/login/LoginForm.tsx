"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { EmailPasswordSignIn } from "@/components/EmailPasswordSignIn";

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const idle = searchParams.get("idle") === "1";

  return (
    <AuthFrame
      eyebrow="Iniciar sesión"
      title="Entrá a tu cuenta"
      description={
        idle
          ? "Cerramos tu sesión por inactividad. Volvé a entrar para continuar."
          : "Si ya tenés contraseña, usala acá. Si todavía no creaste una, tocá “Tenés que crear una contraseña”."
      }
    >
      <EmailPasswordSignIn next={next} />
      <p className="auth-switch">
        ¿Primera vez?{" "}
        <Link
          href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        >
          Crear cuenta
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
