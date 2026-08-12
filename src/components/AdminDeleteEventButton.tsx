"use client";

import { DeleteEventButton } from "@/components/DeleteEventButton";

/** @deprecated Prefer DeleteEventButton */
export function AdminDeleteEventButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  return (
    <DeleteEventButton eventId={eventId} title={title} label="Borrar" />
  );
}
