"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { RegistroClerkSignUp } from "@/components/RegistroClerkSignUp";
import type { OnboardingRole } from "@/lib/onboarding";
import "../auth.css";

function RegistroInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState<OnboardingRole | null>(
    roleParam === "brand" || roleParam === "creator" ? roleParam : null
  );

  if (!role) {
    return (
      <AuthFrame
        eyebrow="Nueva cuenta"
        title="Creá tu cuenta"
        description="Primero elegí cómo vas a usar CONNECTA. Después email y contraseña."
      >
        <div className="auth-role-grid">
          <button
            type="button"
            className="auth-role-card"
            onClick={() => setRole("creator")}
          >
            <strong>Creador de contenido</strong>
            <span>Postulate a eventos de marcas y armá tu historial.</span>
          </button>
          <button
            type="button"
            className="auth-role-card"
            onClick={() => setRole("brand")}
          >
            <strong>Marca / Empresa</strong>
            <span>Publicá eventos y recibí postulaciones.</span>
          </button>
        </div>
        <p className="auth-switch">
          ¿Ya tenés cuenta?{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          >
            Ingresar
          </Link>
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Nueva cuenta"
      title="Email y contraseña"
      description={
        role === "brand"
          ? "Creá el acceso de tu marca. Después completás el perfil."
          : "Creá tu acceso. Después completás el perfil de creador."
      }
    >
      <button
        type="button"
        className="auth-secondary"
        style={{ marginBottom: 18 }}
        onClick={() => setRole(null)}
      >
        ← Cambiar: {role === "brand" ? "Marca" : "Creador"}
      </button>
      <RegistroClerkSignUp role={role} next={next} />
      <p className="auth-switch">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        >
          Ingresar
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <RegistroInner />
    </Suspense>
  );
}
