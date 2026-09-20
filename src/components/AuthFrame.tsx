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

export function AuthFrame({
  eyebrow,
  title,
  description,
  wide = false,
  showMobileTitle = false,
  progress,
  onBack,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  wide?: boolean;
  /** On mobile, show the title above the card (password / signup steps). */
  showMobileTitle?: boolean;
  progress?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`auth-page${showMobileTitle ? " auth-page--mobile-title" : ""}`}
    >
      <header className="auth-header">
        <Logo
          href="/"
          className="auth-logo"
          aria-label="Connecta, ir al inicio"
        />
        {onBack ? (
          <button type="button" className="auth-header-back" onClick={onBack}>
            ← Volver
          </button>
        ) : null}
      </header>

      <div className={`auth-shell${wide ? " auth-shell-wide" : ""}`}>
        <aside className="auth-aside">
          <Logo
            href="/"
            className="auth-aside-logo"
            aria-label="Connecta, ir al inicio"
          />
        </aside>

        <main className="auth-main">
          {onBack ? (
            <button type="button" className="auth-inline-back" onClick={onBack}>
              ← Volver
            </button>
          ) : null}
          {progress}
          <h1>{title}</h1>
          {eyebrow ? <p className="auth-subtitle">{eyebrow}</p> : null}
          {description ? (
            <p
              className={`auth-description${
                description.toLowerCase().includes("inactividad")
                  ? " is-alert"
                  : ""
              }`}
            >
              {description}
            </p>
          ) : null}
          <div className="auth-panel">{children}</div>
        </main>
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
