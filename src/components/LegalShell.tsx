import Link from "next/link";
import { LogoWordmark } from "@/components/LogoWordmark";
import "@/app/landing.css";
import "./legal.css";

export function LegalShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page legal-page">
      <header className="landing-header">
        <div className="landing-nav">
          <Link href="/" aria-label="Connecta, inicio">
            <LogoWordmark className="landing-logo" />
          </Link>
          <Link href="/" className="landing-btn landing-btn-outline landing-btn-small">
            Volver al inicio
          </Link>
        </div>
      </header>
      <main className="legal-main">
        <div className="landing-wrap legal-wrap">
          <span className="frame-label">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="legal-updated">Última actualización: agosto 2026</p>
          <div className="legal-body">{children}</div>
        </div>
      </main>
      <footer className="landing-footer">
        <div className="landing-wrap">
          <Link href="/" aria-label="Connecta, inicio">
            <LogoWordmark className="landing-logo" />
          </Link>
          <nav aria-label="Enlaces legales">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/defensa-del-consumidor">Defensa del consumidor</Link>
            <Link href="/seguridad">Seguridad</Link>
            <Link href="/contacto">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
