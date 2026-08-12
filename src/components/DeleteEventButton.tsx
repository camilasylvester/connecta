"use client";

import { useTransition } from "react";
import { deleteEvent } from "@/app/actions";

export function DeleteEventButton({
  eventId,
  title,
  className = "btn btn-sm btn-outline btn-danger",
  label = "Borrar evento",
}: {
  eventId: string;
  title: string;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const ok = window.confirm(
      `¿Borrar el evento “${title}”?\n\nTambién se borran sus postulaciones. No se puede deshacer.`
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className={className}
    >
      {pending ? "Borrando…" : label}
    </button>
  );
}
