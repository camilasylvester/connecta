import Link from "next/link";
import { Logo } from "@/components/Logo";

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
        <Link href="/" className="auth-back">← Volver a la landing</Link>
      </header>
      <main className={`auth-main ${wide ? "auth-main-wide" : ""}`}>
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        <div className="auth-panel">{children}</div>
      </main>
      <footer className="auth-footer">
        <span>CONNECTA / 2026</span>
        <span>ARG—BA</span>
      </footer>
    </div>
  );
}
