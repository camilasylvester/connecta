"use client";

import { useState } from "react";

const CREATOR_ROWS = [
  ["Colaboraciones", "14"],
  ["Reseñas de marcas", "4.9 / 5"],
  ["Redes conectadas", "Instagram, TikTok"],
  ["Última colaboración", "Costa 7070"],
];

const BRAND_ROWS = [
  ["Postulantes", "200"],
  ["Confirmados", "50"],
  ["Reseñas de creadores", "4.8 / 5"],
  ["Estado", "Activo"],
];

export function LandingProfilePreview() {
  const [view, setView] = useState<"creator" | "brand">("creator");
  const creator = view === "creator";

  return (
    <div className="cv-demo">
      <div className="cv-tabs" role="tablist" aria-label="Vista de ejemplo">
        <button
          type="button"
          role="tab"
          aria-selected={creator}
          className={creator ? "active" : ""}
          onClick={() => setView("creator")}
        >
          Perfil de creador
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!creator}
          className={!creator ? "active" : ""}
          onClick={() => setView("brand")}
        >
          Evento de marca
        </button>
      </div>

      <div className="cv-card" role="tabpanel">
        <div className="cv-card-head">
          <div className="cv-avatar" aria-hidden="true">
            {creator ? "JC" : "C7"}
          </div>
          <div>
            <strong>{creator ? "Juli Creadora" : "Costa 7070"}</strong>
            <span>
              {creator
                ? "@juli.crea · Lifestyle · CABA"
                : "Gastronomía · Palermo"}
            </span>
          </div>
        </div>
        <dl>
          {(creator ? CREATOR_ROWS : BRAND_ROWS).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
