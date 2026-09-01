type StatusFilter = "approved" | "pending" | "rejected" | "all";

const LABELS: Record<StatusFilter, string> = {
  approved: "Aprobadas",
  pending: "Pendientes",
  rejected: "Rechazadas",
  all: "Todas",
};

export function AdminExportCreatorsButton({
  status = "approved",
  compact = false,
}: {
  status?: StatusFilter;
  compact?: boolean;
}) {
  const href = `/api/admin/export-creators?status=${status}`;

  if (compact) {
    return (
      <a href={href} className="btn btn-outline btn-sm" download>
        {LABELS[status]}
      </a>
    );
  }

  return (
    <a href={href} className="btn btn-outline btn-sm" download>
      Descargar CSV — {LABELS[status].toLowerCase()}
    </a>
  );
}
