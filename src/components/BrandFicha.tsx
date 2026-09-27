"use client";

import { useRef, useState, type ReactNode } from "react";
import { InstagramLink } from "@/components/InstagramLink";
import { ProfileEditClient } from "@/components/ProfileEditClient";
import type { OnboardingPayload } from "@/lib/onboarding";
import { isAllowedStoredImageUrl } from "@/lib/image-compress";
import "./brand-ficha.css";

export type BrandFichaAudience = "admin" | "self" | "creator";

export type BrandFichaModel = {
  id: string;
  brandName: string | null;
  displayName: string | null;
  industry: string | null;
  category: string | null;
  companyLocation: string | null;
  city: string | null;
  province: string | null;
  handle: string | null;
  tiktokHandle: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  contactChannel: string | null;
  goals: string[] | null;
  avatarUrl: string | null;
  website: string | null;
  summary: string | null;
  galleryUrls: string[] | null;
  accountStatus: "pending" | "approved" | "rejected";
  onboardingCompleted: boolean;
};

function registrantName(brand: BrandFichaModel): string {
  const brandName = (brand.brandName || "").trim().toLowerCase();
  const person = (brand.displayName || "").trim();
  const contact = (brand.contactPerson || "").trim();
  if (person && person.toLowerCase() !== brandName) return person;
  if (contact && contact.toLowerCase() !== brandName) return contact;
  return "";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function siteLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function photosOf(urls: string[] | null): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter((url) => isAllowedStoredImageUrl(url));
}

export function BrandFicha({
  brand,
  audience,
  canEdit,
  initial,
}: {
  brand: BrandFichaModel;
  audience: BrandFichaAudience;
  canEdit: boolean;
  initial?: OnboardingPayload;
}) {
  const [editing, setEditing] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const title = brand.brandName || brand.displayName || "Marca";
  const subtitle = registrantName(brand);
  const rubro = brand.industry || brand.category || "";
  const location = brand.companyLocation || brand.city || brand.province || "";
  const photos = photosOf(brand.galleryUrls);
  const shown = photos.slice(0, 2);
  const logo =
    brand.avatarUrl && isAllowedStoredImageUrl(brand.avatarUrl)
      ? brand.avatarUrl
      : null;
  const goals = Array.isArray(brand.goals) ? brand.goals : [];
  const whatsapp = brand.phone || brand.contactChannel || "";

  const statusLabel =
    brand.accountStatus === "approved"
      ? "Aprobada"
      : brand.accountStatus === "rejected"
        ? "Rechazada"
        : "Pendiente";

  const rowsMarca: Array<[string, ReactNode]> = [
    ["Nombre", title],
    ["Rubro", rubro || "—"],
    ["Ubicación", location || "—"],
    [
      "Instagram",
      brand.handle ? (
        <InstagramLink handle={brand.handle} className="" />
      ) : (
        "—"
      ),
    ],
  ];
  if (brand.tiktokHandle) rowsMarca.push(["TikTok", brand.tiktokHandle]);
  if (brand.website) {
    rowsMarca.push([
      "Web",
      <a
        key="web"
        href={brand.website}
        target="_blank"
        rel="noopener noreferrer"
      >
        {siteLabel(brand.website)}
      </a>,
    ]);
  }

  const rowsContacto: Array<[string, string]> = [];
  if (brand.contactPerson) rowsContacto.push(["Persona", brand.contactPerson]);
  if (brand.email) rowsContacto.push(["Mail", brand.email]);
  if (whatsapp) rowsContacto.push(["WhatsApp", whatsapp]);
  if (goals.length) rowsContacto.push(["Buscan", goals.join(" · ")]);

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
          <div className="brand-ficha-avatar" aria-hidden={logo ? undefined : true}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" />
            ) : (
              initials(title)
            )}
          </div>
          <div className="brand-ficha-who">
            <h1>{title}</h1>
            {subtitle ? <p className="brand-ficha-sub">{subtitle}</p> : null}
            {brand.summary ? <p className="brand-ficha-bio">{brand.summary}</p> : null}
            {rubro ? (
              <div className="brand-ficha-pills">
                <span className="brand-ficha-pill">{rubro}</span>
              </div>
            ) : null}
          </div>
          {canEdit ? (
            <button
              type="button"
              className={
                editing
                  ? "brand-ficha-btn"
                  : "brand-ficha-btn brand-ficha-btn-solid"
              }
              onClick={() => setEditing((open) => !open)}
            >
              {editing ? "Listo" : "Editar ficha"}
            </button>
          ) : null}
        </div>

        {audience === "admin" ? (
          <div className="brand-ficha-stats">
            <div>
              <b>Marca</b>
              <span>Perfil</span>
            </div>
            <div>
              <b>{statusLabel}</b>
              <span>Cuenta</span>
            </div>
            <div>
              <b>{brand.onboardingCompleted ? "Completo" : "Incompleto"}</b>
              <span>Formulario</span>
            </div>
          </div>
        ) : null}

        {editing && initial ? (
          <div className="brand-ficha-edit">
            <ProfileEditClient
              initial={initial}
              variant="dark"
              profileId={audience === "admin" ? brand.id : undefined}
            />
          </div>
        ) : (
          <>
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
              </section>
            ) : null}

            <section className="brand-ficha-block">
              <h2>La marca</h2>
              {rowsMarca.map(([label, value]) => (
                <div className="brand-ficha-row" key={label}>
                  <span>{label}</span>
                  <div>{value}</div>
                </div>
              ))}
            </section>

            {rowsContacto.length > 0 ? (
              <section className="brand-ficha-block">
                <h2>{audience === "self" ? "Tu contacto" : "Contacto"}</h2>
                {rowsContacto.map(([label, value]) => (
                  <div className="brand-ficha-row" key={label}>
                    <span>{label}</span>
                    <div>{value}</div>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        )}
      </article>

      {photosOpen ? (
        <div
          className="brand-ficha-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhotosOpen(false);
          }}
        >
          <div className="brand-ficha-overlay-card" role="dialog" aria-modal="true" aria-label="Más fotos">
            <div className="brand-ficha-overlay-head">
              <h2>Más fotos</h2>
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
