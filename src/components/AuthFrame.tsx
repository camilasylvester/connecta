import Link from "next/link";
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
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  wide?: boolean;
  /** On mobile, show the title above the card (password / signup steps). */
  showMobileTitle?: boolean;
  children: React.ReactNode;
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
      </header>

      <div className={`auth-shell${wide ? " auth-shell-wide" : ""}`}>
        <aside className="auth-aside" aria-hidden="true">
          <p className="auth-aside-kicker">CONNECTA</p>
          <p className="auth-aside-title">
            Marcas y creadores,
            <br />
            en un mismo lugar.
          </p>
          <p className="auth-aside-copy">
            Entrá para postularte, publicar eventos o seguir tu solicitud.
          </p>
        </aside>

        <main className="auth-main">
          <span className="auth-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
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
