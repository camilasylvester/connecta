"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

const FOOTER_LINKS = [
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/defensa-del-consumidor", label: "Defensa del consumidor" },
  { href: "/seguridad", label: "Seguridad" },
  { href: "/contacto", label: "Contacto" },
] as const;

/**
 * Access step shell: progress outside, title+Clerk inside a dark card.
 * Logo stays small in the header (not inside the card).
 */
export function AuthAccessLayout({
  progress,
  onBack,
  title,
  description,
  children,
  footer,
}: {
  progress?: ReactNode;
  onBack?: () => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page auth-page--centered auth-page--access">
      <header className="auth-header auth-header--access">
        {onBack ? (
          <button type="button" className="auth-header-back" onClick={onBack}>
            ← Volver
          </button>
        ) : (
          <span className="auth-header-spacer" aria-hidden />
        )}
        <Logo
          href="/"
          className="auth-logo"
          aria-label="Connecta, ir al inicio"
        />
        <span className="auth-header-spacer" aria-hidden />
      </header>

      <div className="auth-shell auth-shell--access">
        <div className="auth-access-wrap">
          {progress}
          <div className="auth-access-card">
            <h1 className="auth-access-title">{title}</h1>
            {description ? (
              <p className="auth-access-desc">{description}</p>
            ) : null}
            <div className="auth-access-form">{children}</div>
            <p className="auth-access-legal">
              Al continuar aceptás los{" "}
              <Link href="/terminos" target="_blank" rel="noreferrer">
                Términos
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" rel="noreferrer">
                Política de privacidad
              </Link>
              .
            </p>
          </div>
          {footer}
        </div>
      </div>

      <footer className="auth-footer">
        <span>CONNECTA / 2026</span>
        <nav className="auth-footer-links" aria-label="Enlaces legales">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
