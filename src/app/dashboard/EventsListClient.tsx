"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventStatus } from "@/lib/types";
import { statusMeta } from "./brand-helpers";

export type EventCardData = {
  id: string;
  title: string;
  location: string | null;
  eventDate: string | null;
  status: EventStatus;
  brandLabel: string;
  poster: string;
  coverUrl?: string | null;
  dateLabel: string;
  total: number;
  confirmed: number;
  pending: number;
};

type Filter = "activos" | "finalizados" | "borradores";

function defaultFilter(events: EventCardData[]): Filter {
  if (events.some((e) => e.status === "active")) return "activos";
  if (events.some((e) => e.status === "closed")) return "finalizados";
  if (events.some((e) => e.status === "draft")) return "borradores";
  return "activos";
}

export function EventsListClient({ events }: { events: EventCardData[] }) {
  const [filter, setFilter] = useState<Filter>(() => defaultFilter(events));

  const filtered = useMemo(() => {
    return events.filter((ev) => statusMeta(ev.status).filter === filter);
  }, [events, filter]);

  const counts = useMemo(() => {
    return {
      activos: events.filter((e) => e.status === "active").length,
      finalizados: events.filter((e) => e.status === "closed").length,
      borradores: events.filter((e) => e.status === "draft").length,
    };
  }, [events]);

  return (
    <>
      <div className="tabs-row">
        {(
          [
            ["activos", `Activos`],
            ["finalizados", `Finalizados`],
            ["borradores", `Pendientes`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`tab-pill${filter === key ? " is-active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {counts[key] > 0 ? ` (${counts[key]})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>
            {filter === "activos"
              ? "No hay eventos activos"
              : filter === "finalizados"
                ? "No hay eventos finalizados"
                : "No hay eventos pendientes"}
          </h3>
          <p>
            {filter === "activos" ? (
              <>
                Creá el primero. CONNECTA lo revisa y lo publica.{" "}
                <Link href="/dashboard/eventos/nuevo">Crear evento →</Link>
              </>
            ) : filter === "borradores" ? (
              "Cuando creás un evento, queda acá hasta que un admin lo acepte."
            ) : (
              "Cuando cambies el estado de un evento, va a aparecer acá."
            )}
          </p>
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map((ev) => {
            const meta = statusMeta(ev.status);
            const letter = ev.brandLabel.charAt(0).toUpperCase() || "E";
            return (
              <Link
                key={ev.id}
                href={`/dashboard/eventos/${ev.id}`}
                className="event-row-card"
              >
                <div
                  className={`event-row-poster ${ev.coverUrl ? "has-photo" : ev.poster}`}
                  style={
                    ev.coverUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(0,0,0,.5)), url(${ev.coverUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  {!ev.coverUrl ? (
                    <span className="letter">{letter}</span>
                  ) : null}
                  <span className="brand">{ev.brandLabel}</span>
                </div>
                <div className="event-row-body">
                  <div className="event-row-top">
                    <div>
                      <h4>{ev.title}</h4>
                      <div className="meta">
                        {ev.location || "Sin ubicación"} · {ev.dateLabel}
                      </div>
                    </div>
                    <span className={`status-badge ${meta.className}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="event-row-stats">
                    <div className="stat-mini">
                      <b>{ev.total}</b>Postulantes
                    </div>
                    <div className="stat-mini">
                      <b>{ev.confirmed}</b>Confirmados
                    </div>
                    <div
                      className={`stat-mini${ev.pending > 0 ? " alert" : ""}`}
                    >
                      <b>{ev.pending}</b>Sin revisar
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
