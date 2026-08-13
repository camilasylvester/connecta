"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/eventos", label: "Todos los eventos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/postulaciones", label: "Postulaciones" },
] as const;

export function AdminShell({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="brand-app">
      <div className="app">
        <header className="admin-mobile-bar">
          <Logo href="/admin" className="logo" />
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className="admin-menu-toggle"
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </header>

        <aside className={`sidebar${open ? " is-open" : ""}`}>
          <Logo href="/admin" className="logo" />
          <span className="admin-badge">Vista admin</span>
          <nav className="sidebar-nav">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`sidebar-link${
                  isActive(link.href, "exact" in link && link.exact)
                    ? " active"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="sidebar-divider" />
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="sidebar-link is-secondary"
            >
              Vista marca →
            </Link>
            <Link
              href="/eventos"
              onClick={() => setOpen(false)}
              className="sidebar-link is-secondary"
            >
              Vista influencer →
            </Link>
          </nav>
          <div className="sidebar-account">
            <div className="av">A</div>
            <div>
              <div className="name">{displayName || "Admin"}</div>
              <div className="role">Acceso total</div>
            </div>
          </div>
          <LogoutButton className="sidebar-logout" />
        </aside>

        <main className="main">{children}</main>
      </div>
    </div>
  );
}
