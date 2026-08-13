"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type FeedEventCard = {
  id: string;
  title: string;
  brand: string;
  cat: string;
  catSlugs: string[];
  catLabel: string;
  place: string;
  status: "open" | "soon" | "full";
  poster: string;
  coverUrl?: string | null;
  href: string;
};

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "gastronomia", label: "Gastronomía" },
  { id: "fitness", label: "Fitness" },
  { id: "moda", label: "Moda" },
  { id: "arte", label: "Arte" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

const statusMap = {
  open: { cls: "feed-tag-open", label: "Abierto" },
  soon: { cls: "feed-tag-soon", label: "Cierra pronto" },
  full: { cls: "feed-tag-full", label: "Cupo lleno" },
} as const;

export function EventosFeedClient({ events }: { events: FeedEventCard[] }) {
  const [filter, setFilter] = useState<string>("todos");

  const filtered = useMemo(() => {
    if (filter === "todos") return events;
    return events.filter((e) => e.catSlugs.includes(filter));
  }, [events, filter]);

  return (
    <>
      <div className="feed-filters">
        <div className="feed-wrap feed-filters-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`feed-chip ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="feed-events-section" id="eventos">
        <div className="feed-wrap">
          <div className="feed-events-head">
            <h2>Eventos abiertos</h2>
            <span className="feed-events-count">
              {filtered.length} evento{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="feed-empty">
              Todavía no hay eventos en esta categoría.
            </div>
          ) : (
            <div className="feed-grid">
              {filtered.map((ev) => {
                const s = statusMap[ev.status];
                const letter = (ev.brand || "E").charAt(0).toUpperCase();
                return (
                  <Link
                    key={ev.id}
                    href={ev.href}
                    className={`feed-event-card ${ev.status === "full" ? "is-full" : ""}`}
                  >
                    <div
                      className={`feed-poster ${ev.coverUrl ? "has-photo" : `feed-${ev.poster}`}`}
                    >
                      {ev.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.coverUrl}
                          alt=""
                          className="feed-poster-img"
                        />
                      ) : (
                        <span className="feed-poster-letter">{letter}</span>
                      )}
                      <span className={`feed-poster-tag ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="feed-event-meta">
                      <span className="feed-event-cat">{ev.catLabel}</span>
                      <h4>{ev.title}</h4>
                      <span className="feed-event-sub">
                        {[ev.brand, ev.place].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
