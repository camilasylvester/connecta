import Link from "next/link";
import { LogoWordmark } from "@/components/LogoWordmark";

const LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/defensa-del-consumidor", label: "Defensa del consumidor" },
  { href: "/seguridad", label: "Seguridad" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function SiteFooter({
  variant = "landing",
}: {
  variant?: "landing" | "feed";
}) {
  if (variant === "feed") {
    return (
      <footer className="feed-footer">
        <div className="feed-wrap feed-footer-row">
          <Link href="/" className="feed-logo" aria-label="Connecta, inicio">
            <LogoWordmark className="feed-logo-svg" />
          </Link>
          <span className="feed-footer-meta">CONNECTA / 2026</span>
          <nav className="feed-footer-links" aria-label="Enlaces legales">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="landing-footer">
      <div className="landing-wrap">
        <Link href="/" aria-label="Connecta, inicio">
          <LogoWordmark className="landing-logo" />
        </Link>
        <nav aria-label="Enlaces legales">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
