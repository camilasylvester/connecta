"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Resumen", match: (p: string) => p === "/dashboard" },
  {
    href: "/dashboard/eventos",
    label: "Mis eventos",
    match: (p: string) => p.startsWith("/dashboard/eventos"),
  },
  {
    href: "/dashboard/explorar",
    label: "Creadores",
    match: (p: string) =>
      p.startsWith("/dashboard/creadores") || p.startsWith("/dashboard/explorar"),
  },
  {
    href: "/dashboard/resenas",
    label: "Reseñas",
    match: (p: string) => p.startsWith("/dashboard/resenas"),
  },
  {
    href: "/dashboard/config",
    label: "Mi perfil",
    match: (p: string) => p.startsWith("/dashboard/config"),
  },
] as const;

export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {isAdmin && (
        <Link href="/admin" className="sidebar-link">
          ← Panel admin
        </Link>
      )}
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`sidebar-link${link.match(pathname) ? " active" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
