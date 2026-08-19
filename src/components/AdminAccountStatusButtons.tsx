"use client";

import { useTransition } from "react";
import { adminSetAccountStatus } from "@/app/actions";

export function AdminAccountStatusButtons({
  profileId,
  currentStatus,
  allowApprove = true,
}: {
  profileId: string;
  currentStatus: "pending" | "approved" | "rejected";
  allowApprove?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function setStatus(status: "approved" | "rejected") {
    const label =
      status === "approved" ? "aprobar" : "rechazar";
    const ok = window.confirm(`¿Confirmás ${label} esta solicitud?`);
    if (!ok) return;
    startTransition(async () => {
      await adminSetAccountStatus(profileId, status);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus !== "approved" && allowApprove ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("approved")}
          className="btn btn-sm btn-outline btn-approve"
        >
          {pending ? "Guardando…" : "Aceptar"}
        </button>
      ) : null}
      {currentStatus !== "rejected" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("rejected")}
          className="btn btn-sm btn-outline btn-danger"
        >
          {pending ? "Guardando…" : "Rechazar"}
        </button>
      ) : null}
      {currentStatus === "approved" ? (
        <span className="status-badge status-ok">Cuenta aprobada</span>
      ) : null}
      {currentStatus === "rejected" ? (
        <span className="status-badge status-bad">Cuenta rechazada</span>
      ) : null}
    </div>
  );
}
