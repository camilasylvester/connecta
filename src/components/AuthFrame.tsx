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
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Logo href="/" className="auth-logo" />
        <Link href="/" className="auth-back">
          ← Volver a la landing
        </Link>
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
          {description ? <p className="auth-description">{description}</p> : null}
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
