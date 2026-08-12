"use client";

import { useState, useTransition } from "react";
import { deleteCreatorPost } from "@/app/actions";
import type { CreatorPost } from "@/db/schema";
import { platformLabel } from "@/lib/posts";
import { posterClass } from "@/app/dashboard/brand-helpers";

function formatMetric(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("es-AR");
}

export function CreatorFeed({
  posts,
  editable = false,
  creatorHandle,
}: {
  posts: CreatorPost[];
  editable?: boolean;
  creatorHandle?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<CreatorPost | null>(null);

  function remove(id: string) {
    if (!window.confirm("¿Borrar esta publicación del feed?")) return;
    startTransition(async () => {
      await deleteCreatorPost(id);
    });
  }

  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-dark">
        {editable
          ? "Todavía no cargaste publicaciones. Pegá un link con “+ Nueva publicación”."
          : "Este creador todavía no cargó publicaciones."}
      </p>
    );
  }

  return (
    <div style={pending ? { opacity: 0.7 } : undefined}>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1">
        {posts.map((p, i) => {
          return (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden bg-ink"
            >
              <button
                type="button"
                className="absolute inset-0 block h-full w-full text-left"
                onClick={() => setOpen(p)}
              >
                {p.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-full w-full ${posterClass(p.id)}`}
                    style={{
                      background:
                        i % 2 === 0
                          ? "linear-gradient(155deg,#211c3d,#060608 70%)"
                          : "linear-gradient(200deg,#6F6AE0,#0A0910 68%)",
                    }}
                  />
                )}
                <span className="absolute right-2 top-2 rounded bg-black/55 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  {platformLabel(p.platform)}
                </span>
                {p.url ? (
                  <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[10px] text-white">
                    ↗
                  </span>
                ) : null}

                {/* Hover: likes / comments / views (Instagram-style) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <HeartIcon />
                      {formatMetric(p.likesCount)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CommentIcon />
                      {formatMetric(p.commentsCount)}
                    </span>
                    {p.viewsCount != null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <PlayIcon />
                        {formatMetric(p.viewsCount)}
                      </span>
                    ) : null}
                  </div>
                  {p.caption ? (
                    <p className="line-clamp-3 max-w-[90%] text-center text-xs font-medium text-white/85">
                      {p.caption}
                    </p>
                  ) : null}
                </div>
              </button>
              {editable ? (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="absolute bottom-2 right-2 z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-600"
                >
                  Borrar
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-ink-2 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">
                  {creatorHandle || "Publicación"}
                </div>
                <div className="text-xs text-muted-dark">
                  {platformLabel(open.platform)}
                  {open.brandLabel ? ` · ${open.brandLabel}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-sm text-muted-dark hover:text-white"
              >
                Cerrar
              </button>
            </div>
            {open.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={open.thumbUrl}
                alt=""
                className="mb-4 max-h-64 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mb-4 flex flex-wrap gap-4 text-sm font-bold text-white">
              <span>♥ {formatMetric(open.likesCount)} likes</span>
              <span>💬 {formatMetric(open.commentsCount)} comentarios</span>
              {open.viewsCount != null ? (
                <span>▶ {formatMetric(open.viewsCount)} vistas</span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-white/90">
              {open.caption}
            </p>
            {open.url ? (
              <a
                href={open.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-purple-2 hover:underline"
              >
                Abrir en {platformLabel(open.platform)} →
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M12 21s-7.2-4.35-9.6-8.4C.6 9.3 2.1 5.5 5.7 5.5c2 0 3.3 1.2 4.1 2.3.8-1.1 2.1-2.3 4.1-2.3 3.6 0 5.1 3.8 3.3 7.1C19.2 16.65 12 21 12 21z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
