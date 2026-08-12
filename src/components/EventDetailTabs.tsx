"use client";

import { useState } from "react";
import { SolicitudesClient } from "@/components/SolicitudesClient";
import { EventImagesField } from "@/components/EventImagesField";
import { AdminApproveEventButton } from "@/components/AdminApproveEventButton";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import type { ApplicationWithCreator, Event } from "@/lib/types";
import {
  formatEventDateLong,
  posterClass,
} from "@/app/dashboard/brand-helpers";
import { CopyLinkButton } from "@/components/CopyLinkButton";

function eventCover(event: Event): string | null {
  const urls = Array.isArray(event.imageUrls) ? event.imageUrls : [];
  return urls[0] || null;
}

export function EventDetailTabs({
  event,
  brandLabel,
  applications,
  inviteUrl,
  saveAction,
  closeAction,
  initialTab = "solicitudes",
  canPublish = false,
}: {
  event: Event;
  brandLabel: string;
  applications: ApplicationWithCreator[];
  inviteUrl: string;
  saveAction: (formData: FormData) => Promise<void>;
  closeAction: () => Promise<void>;
  initialTab?: "solicitudes" | "evento";
  canPublish?: boolean;
}) {
  const [tab, setTab] = useState<"solicitudes" | "evento">(initialTab);
  const cover = eventCover(event);
  const gallery = Array.isArray(event.imageUrls) ? event.imageUrls : [];

  const approved = applications.filter((a) => a.status === "approved").length;
  const pending = applications.filter((a) => a.status === "pending").length;
  const pct = Math.min(
    100,
    Math.round((approved / Math.max(event.quota, 1)) * 100)
  );

  const categoryLabel = (event.category || "").trim();
  const profileSought = (event.profileSought || "").trim();

  return (
    <>
      <div className="quota-box">
        <div className="quota-top">
          <b>
            {approved} de {event.quota} cupos confirmados
          </b>
          <span>
            {applications.length} postulaciones totales · {pending} sin revisar
          </span>
        </div>
        <div className="quota-bar">
          <div className="quota-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="main-tabs">
        <button
          type="button"
          className={`main-tab${tab === "solicitudes" ? " is-active" : ""}`}
          onClick={() => setTab("solicitudes")}
        >
          Solicitudes
        </button>
        <button
          type="button"
          className={`main-tab${tab === "evento" ? " is-active" : ""}`}
          onClick={() => setTab("evento")}
        >
          Evento
        </button>
      </div>

      <div
        className={`panel${tab === "solicitudes" ? " is-active" : ""}`}
        id="panel-solicitudes"
      >
        <SolicitudesClient
          eventId={event.id}
          applications={applications}
        />
      </div>

      <div
        className={`panel${tab === "evento" ? " is-active" : ""}`}
        id="panel-evento"
      >
        <p className="panel-section-label">Cómo lo ven las marcas / creadores</p>
        <div className="event-info-card">
          <div
            className={`event-info-poster ${cover ? "has-photo" : posterClass(event.id)}`}
            style={
              cover
                ? {
                    backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(0,0,0,.65)), url(${cover})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <span className="brand">{brandLabel}</span>
          </div>
          <div className="event-info-body">
            <div className="field">
              <label>Fecha</label>
              <div className="val">{formatEventDateLong(event.eventDate)}</div>
            </div>
            <div className="field">
              <label>Ubicación</label>
              <div className="val">{event.location || "Sin ubicación"}</div>
            </div>
            <div className="field">
              <label>Cupos</label>
              <div className="val">{event.quota} creadores</div>
            </div>
            <div className="field">
              <label>Estado</label>
              <div className="val">
                {event.status === "active"
                  ? "Activo — recibe postulaciones"
                  : event.status === "closed"
                    ? "Cerrado — no recibe más"
                    : "Borrador — no público"}
              </div>
            </div>
            {categoryLabel ? (
              <div className="field full">
                <label>Categoría</label>
                <div className="val tags">
                  <span className="tag-pill">{categoryLabel}</span>
                </div>
              </div>
            ) : null}
            {profileSought ? (
              <div className="field full">
                <label>Perfil buscado</label>
                <div className="val desc profile-sought">{profileSought}</div>
              </div>
            ) : null}
            {event.description ? (
              <div className="field full">
                <label>Descripción</label>
                <div className="val desc">{event.description}</div>
              </div>
            ) : null}
            {gallery.length > 1 ? (
              <div className="field full">
                <label>Galería</label>
                <div className="event-gallery">
                  {gallery.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <b>{applications.length}</b>
            <span>Postulaciones</span>
          </div>
          <div className="stat-card">
            <b>{approved}</b>
            <span>Confirmados</span>
          </div>
          <div className="stat-card">
            <b>{pending}</b>
            <span>Sin revisar</span>
          </div>
        </div>

        <div className="invite-box">
          <h3>Link para influencers</h3>
          <p>
            Compartilo por WhatsApp o Instagram. Solo quien tenga el link puede
            postularse.
          </p>
          <CopyLinkButton url={inviteUrl} />
        </div>

        <form action={saveAction} className="edit-form">
          <h3>Editar datos del evento</h3>
          <p className="edit-form-hint">
            Acá cambiás título, imágenes, cupos, perfil buscado y estado. Guardá
            para publicar los cambios.
          </p>
          <div className="config-field">
            <label>Título</label>
            <input
              className="config-input"
              name="title"
              required
              defaultValue={event.title}
            />
          </div>
          <EventImagesField initial={gallery} />
          <div className="config-row2">
            <div className="config-field">
              <label>Ubicación</label>
              <input
                className="config-input"
                name="location"
                defaultValue={event.location || ""}
              />
            </div>
            <div className="config-field">
              <label>Fecha</label>
              <input
                className="config-input"
                name="event_date"
                type="date"
                defaultValue={event.eventDate || ""}
              />
            </div>
          </div>
          <div className="config-row2">
            <div className="config-field">
              <label>Cupos</label>
              <input
                className="config-input"
                name="quota"
                type="number"
                defaultValue={event.quota}
              />
            </div>
            <div className="config-field">
              <label>Categoría</label>
              <input
                className="config-input"
                name="category"
                defaultValue={event.category || ""}
                placeholder="Ej: Beauty"
              />
            </div>
          </div>
          <div className="config-field">
            <label>Descripción</label>
            <textarea
              className="config-input"
              name="description"
              rows={4}
              defaultValue={event.description || ""}
              placeholder="Qué es el evento, qué tiene que hacer el creador…"
            />
          </div>
          <div className="config-field">
            <label>Perfil buscado</label>
            <textarea
              className="config-input"
              name="profile_sought"
              rows={4}
              defaultValue={event.profileSought || ""}
              placeholder="Edad, nicho, estilo, requisitos… (texto libre)"
            />
          </div>
          <div className="config-field">
            <label>Estado</label>
            {canPublish ? (
              <select
                className="config-input"
                name="status"
                defaultValue={event.status}
              >
                <option value="active">Activo (publicado)</option>
                <option value="draft">Pendiente de aprobación</option>
                <option value="closed">Cerrado (no recibe más)</option>
              </select>
            ) : (
              <>
                <input type="hidden" name="status" value={event.status} />
                <p className="auth-hint" style={{ margin: "8px 0 0" }}>
                  {event.status === "active"
                    ? "Publicado. Un admin puede cerrarlo si hace falta."
                    : event.status === "closed"
                      ? "Cerrado: no recibe postulaciones."
                      : "Esperando que un admin de CONNECTA acepte el evento."}
                </p>
              </>
            )}
          </div>
          <button type="submit" className="btn btn-solid">
            Guardar cambios
          </button>
        </form>

        {canPublish && event.status === "draft" ? (
          <div className="danger-zone" style={{ borderColor: "rgba(111,106,224,.35)" }}>
            <div>
              <h3 className="section-label">Aceptar evento</h3>
              <p>Publicá el evento para que pueda recibir postulaciones.</p>
            </div>
            <AdminApproveEventButton eventId={event.id} title={event.title} />
          </div>
        ) : null}

        {event.status === "active" && (
          <div className="danger-zone">
            <div>
              <h3 className="section-label">Cerrar postulaciones</h3>
              <p>
                Deja de aceptar nuevos creadores. Los ya confirmados se
                mantienen.
              </p>
            </div>
            <form action={closeAction}>
              <input type="hidden" name="status" value="closed" />
              <button type="submit" className="btn btn-outline btn-sm">
                Cerrar ahora
              </button>
            </form>
          </div>
        )}

        <div className="danger-zone">
          <div>
            <h3 className="section-label">Borrar evento</h3>
            <p>
              Elimina el evento y todas sus postulaciones. No se puede
              deshacer.
            </p>
          </div>
          <DeleteEventButton eventId={event.id} title={event.title} />
        </div>
      </div>
    </>
  );
}
