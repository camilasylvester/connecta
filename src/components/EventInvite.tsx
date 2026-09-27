"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import "./brand-ficha.css";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "E";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function EventInvite({
  title,
  brandLabel,
  brandHref,
  brandAvatarUrl,
  description,
  category,
  rows,
  sought,
  photos,
  children,
}: {
  title: string;
  brandLabel: string | null;
  brandHref: string | null;
  brandAvatarUrl: string | null;
  description: string | null;
  category: string | null;
  rows: Array<[string, string]>;
  sought: string | null;
  photos: string[];
  children: ReactNode;
}) {
  const [photosOpen, setPhotosOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const shown = photos.slice(0, 2);
  const mark = brandLabel || title;

  function nextPhoto() {
    const strip = stripRef.current;
    if (!strip) return;
    const last = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 8;
    strip.scrollTo({
      left: last ? 0 : strip.scrollLeft + strip.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className="brand-ficha">
      <article className="brand-ficha-card">
        <div className="brand-ficha-top">
          <div className="brand-ficha-id">
            <div className="brand-ficha-avatar">
              {brandAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandAvatarUrl} alt="" />
              ) : (
                initials(mark)
              )}
            </div>
            <div className="brand-ficha-who">
              <div className="brand-ficha-titles">
                <h1>{title}</h1>
                {brandLabel ? (
                  <p className="brand-ficha-sub">
                    {brandHref ? (
                      <Link href={brandHref}>{brandLabel}</Link>
                    ) : (
                      brandLabel
                    )}
                  </p>
                ) : null}
              </div>
              {description ? (
                <p className="brand-ficha-bio apply-bio">{description}</p>
              ) : null}
              {category ? (
                <div className="brand-ficha-pills">
                  <span className="brand-ficha-pill">{category}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {shown.length > 0 ? (
          <section className="brand-ficha-block">
            <h2>Fotos</h2>
            <div className="brand-ficha-gallery">
              {shown.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" />
              ))}
            </div>
            {photos.length > 2 ? (
              <button
                type="button"
                className="brand-ficha-btn brand-ficha-more"
                onClick={() => setPhotosOpen(true)}
              >
                Ver más fotos
              </button>
            ) : null}
            {photos.length === 2 ? (
              <button
                type="button"
                className="brand-ficha-btn brand-ficha-more brand-ficha-more-mobile"
                onClick={() => setPhotosOpen(true)}
              >
                Ver más fotos
              </button>
            ) : null}
          </section>
        ) : null}

        {rows.length > 0 ? (
          <section className="brand-ficha-block">
            <h2>El evento</h2>
            {rows.map(([label, value]) => (
              <div className="brand-ficha-row" key={label}>
                <span>{label}</span>
                <div>{value}</div>
              </div>
            ))}
          </section>
        ) : null}

        {sought ? (
          <section className="brand-ficha-block">
            <h2>Perfil buscado</h2>
            <div className="brand-ficha-row">
              <span>Buscan</span>
              <div className="apply-sought">{sought}</div>
            </div>
          </section>
        ) : null}

        {children}
      </article>

      {photosOpen ? (
        <div
          className="brand-ficha-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhotosOpen(false);
          }}
        >
          <div
            className="brand-ficha-overlay-card"
            role="dialog"
            aria-modal="true"
            aria-label="Fotos"
          >
            <div className="brand-ficha-overlay-head">
              <h2>Fotos</h2>
              <button
                type="button"
                className="brand-ficha-btn"
                onClick={() => setPhotosOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="brand-ficha-frame">
              <div className="brand-ficha-strip" ref={stripRef}>
                {photos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" />
                ))}
              </div>
              {photos.length > 1 ? (
                <button
                  type="button"
                  className="brand-ficha-next"
                  aria-label="Siguiente foto"
                  onClick={nextPhoto}
                >
                  →
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
