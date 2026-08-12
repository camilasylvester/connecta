"use client";

import { SignOutButton } from "@clerk/nextjs";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <SignOutButton>
      <button type="button" className={className}>
        Cerrar sesión
      </button>
    </SignOutButton>
  );
}
