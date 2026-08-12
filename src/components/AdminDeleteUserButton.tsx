"use client";

import { useTransition } from "react";
import { adminDeleteProfile } from "@/app/actions";

export function AdminDeleteUserButton({
  profileId,
  label,
}: {
  profileId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const ok = window.confirm(
      `¿Borrar permanentemente a “${label}”?\n\nSe eliminan el perfil y sus postulaciones/eventos asociados. Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    startTransition(async () => {
      await adminDeleteProfile(profileId);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="btn btn-sm btn-outline btn-danger"
    >
      {pending ? "Borrando…" : "Borrar registro"}
    </button>
  );
}
