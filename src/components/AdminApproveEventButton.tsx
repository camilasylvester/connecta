"use client";

import { useTransition } from "react";
import { adminApproveEvent } from "@/app/actions";

export function AdminApproveEventButton({
  eventId,
  title,
  className = "btn btn-sm btn-solid",
}: {
  eventId: string;
  title?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onApprove() {
    const ok = window.confirm(
      title
        ? `¿Aceptar el evento “${title}”?\n\nVa a publicarse y recibir postulaciones.`
        : "¿Aceptar este evento? Va a publicarse y recibir postulaciones."
    );
    if (!ok) return;
    startTransition(async () => {
      await adminApproveEvent(eventId);
    });
  }

  return (
    <button
      type="button"
      onClick={onApprove}
      disabled={pending}
      className={className}
    >
      {pending ? "Aceptando…" : "Aceptar"}
    </button>
  );
}
