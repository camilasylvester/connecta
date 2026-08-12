"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/app/actions";
import { InstagramLink } from "@/components/InstagramLink";
import type { ApplicationStatus, ApplicationWithCreator } from "@/lib/types";
import { avatarColor, initialsFromName } from "@/app/dashboard/brand-helpers";
import { instagramUrl } from "@/lib/instagram";

type Tab = ApplicationStatus;

export function SolicitudesClient({
  eventId,
  applications,
}: {
  eventId: string;
  applications: ApplicationWithCreator[];
  quota?: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    return {
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  }, [applications]);

  const filtered = useMemo(() => {
    return applications
      .filter((a) => a.status === tab)
      .filter((a) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const h = a.profiles?.handle?.toLowerCase() || "";
        const n = a.profiles?.displayName?.toLowerCase() || "";
        return h.includes(q) || n.includes(q);
      });
  }, [applications, tab, query]);

  function setStatus(id: string, status: ApplicationStatus) {
    startTransition(async () => {
      await updateApplicationStatus(id, status, eventId);
      router.refresh();
    });
  }

  return (
    <div style={pending ? { opacity: 0.7 } : undefined}>
      <div className="sub-tabs">
        {(
          [
            ["pending", `Pendientes (${counts.pending})`],
            ["approved", `Aprobadas (${counts.approved})`],
            ["rejected", `Rechazadas (${counts.rejected})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`sub-tab${tab === key ? " is-active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="toolbar">
          <input
            className="search-box"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o handle..."
          />
        </div>
      )}

      {tab === "rejected" && (
        <div className="sample-note">
          Solo vos ves esta lista — nunca es visible para el creador ni para
          otras marcas.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No hay postulaciones en esta lista</h3>
          <p>
            {tab === "pending"
              ? "Cuando alguien se postule con el link privado, va a aparecer acá."
              : "Todavía no hay creadores en este estado."}
          </p>
        </div>
      ) : (
        filtered.map((app) => {
          const p = app.profiles;
          const label =
            p?.handle || p?.displayName || "Sin handle";
          const initials = initialsFromName(label);
          const color = avatarColor(app.creatorId || label);

          if (tab === "pending") {
            return (
              <div key={app.id} className="applicant-row">
                <div
                  className="applicant-avatar"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                <div className="applicant-info">
                  <div className="name-row">
                    <h5>
                      <InstagramLink handle={p?.handle}>
                        {label}
                      </InstagramLink>
                    </h5>
                  </div>
                  <div className="meta">
                    <span>
                      {(p?.followers || 0).toLocaleString("es-AR")} seguidores
                    </span>
                    {p?.category ? <span>{p.category}</span> : null}
                    {p?.city ? <span>{p.city}</span> : null}
                    {instagramUrl(p?.handle) ? (
                      <a
                        href={instagramUrl(p?.handle)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver Instagram
                      </a>
                    ) : null}
                    <Link href={`/dashboard/creadores/${app.creatorId}`}>
                      Ver portfolio
                    </Link>
                  </div>
                  {app.message ? (
                    <div className="meta" style={{ marginTop: 4 }}>
                      {app.message}
                    </div>
                  ) : null}
                </div>
                <div className="applicant-actions">
                  <button
                    type="button"
                    className="icon-btn reject"
                    title="Rechazar"
                    onClick={() => setStatus(app.id, "rejected")}
                  >
                    ✕
                  </button>
                  <button
                    type="button"
                    className="icon-btn approve"
                    title="Aceptar"
                    onClick={() => setStatus(app.id, "approved")}
                  >
                    ✓
                  </button>
                </div>
              </div>
            );
          }

          if (tab === "approved") {
            return (
              <div key={app.id} className="applicant-row is-approved">
                <div
                  className="applicant-avatar"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                <div className="applicant-info">
                  <div className="name-row">
                    <h5>
                      <InstagramLink handle={p?.handle}>
                        {label}
                      </InstagramLink>
                    </h5>
                  </div>
                  <div className="meta">
                    <span>
                      {(p?.followers || 0).toLocaleString("es-AR")} seguidores
                    </span>
                    {p?.category ? <span>{p.category}</span> : null}
                    {instagramUrl(p?.handle) ? (
                      <a
                        href={instagramUrl(p?.handle)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver Instagram
                      </a>
                    ) : null}
                    <Link href={`/dashboard/creadores/${app.creatorId}`}>
                      Ver portfolio
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  className="review-btn"
                  onClick={() => setStatus(app.id, "pending")}
                >
                  Volver a pendiente
                </button>
              </div>
            );
          }

          return (
            <div key={app.id} className="applicant-row is-rejected">
              <div
                className="applicant-avatar"
                style={{ background: "#B9B7C9" }}
              >
                {initials}
              </div>
              <div className="applicant-info">
                <h5>
                  <InstagramLink handle={p?.handle}>{label}</InstagramLink>
                </h5>
                <div className="meta">
                  <span>
                    {(p?.followers || 0).toLocaleString("es-AR")} seguidores
                  </span>
                  {p?.category ? <span>{p.category}</span> : null}
                  {instagramUrl(p?.handle) ? (
                    <a
                      href={instagramUrl(p?.handle)!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver Instagram
                    </a>
                  ) : null}
                  <Link href={`/dashboard/creadores/${app.creatorId}`}>
                    Ver portfolio
                  </Link>
                </div>
              </div>
              <button
                type="button"
                className="rejected-note"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setStatus(app.id, "pending")}
              >
                Reabrir
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
