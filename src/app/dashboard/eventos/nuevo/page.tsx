import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createEvent } from "@/app/actions";
import { EventImagesField } from "@/components/EventImagesField";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile } from "@/lib/auth";

export default async function NewEventPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";
  let brands: { id: string; label: string }[] = [];

  if (isAdmin) {
    const db = getDb();
    const rows = await db
      .select({
        id: profiles.id,
        brandName: profiles.brandName,
        displayName: profiles.displayName,
        email: profiles.email,
      })
      .from(profiles)
      .where(eq(profiles.role, "brand"))
      .orderBy(asc(profiles.brandName), asc(profiles.displayName));

    brands = rows.map((b) => ({
      id: b.id,
      label: b.brandName || b.displayName || b.email || b.id,
    }));
  }

  const backHref = isAdmin ? "/admin/eventos" : "/dashboard/eventos";
  const backLabel = isAdmin ? "← Todos los eventos" : "← Mis eventos";

  return (
    <>
      <div className="topbar">
        <div>
          <Link href={backHref} className="back-link">
            {backLabel}
          </Link>
          <h1>Crear evento</h1>
          <div className="sub">
            {isAdmin
              ? "Creá un evento para cualquier marca, con imágenes y datos completos"
              : "Completá los datos. Un admin de CONNECTA lo revisa y lo publica."}
          </div>
        </div>
      </div>
      <div className="content">
        <form action={createEvent} className="edit-form" style={{ maxWidth: 640 }}>
          {isAdmin ? (
            <div className="config-field">
              <label>Marca dueña</label>
              <select className="config-input" name="brand_id" required defaultValue="">
                <option value="" disabled>
                  Elegí una marca…
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="config-field">
            <label>Título</label>
            <input
              className="config-input"
              name="title"
              required
              placeholder="Inauguración de temporada"
            />
          </div>
          <EventImagesField />
          <div className="config-field">
            <label>Ubicación</label>
            <input
              className="config-input"
              name="location"
              placeholder="Buenos Aires"
            />
          </div>
          <div className="config-row2">
            <div className="config-field">
              <label>Fecha</label>
              <input className="config-input" name="event_date" type="date" />
            </div>
            <div className="config-field">
              <label>Cupos</label>
              <input
                className="config-input"
                name="quota"
                type="number"
                defaultValue="50"
              />
            </div>
          </div>
          <div className="config-field">
            <label>Categoría</label>
            <input
              className="config-input"
              name="category"
              placeholder="Gastronomía"
            />
          </div>
          <div className="config-field">
            <label>Descripción</label>
            <textarea
              className="config-input"
              name="description"
              rows={4}
              placeholder="Qué busca la marca, tipo de contenido, vibe del evento…"
            />
          </div>
          <div className="config-field">
            <label>Perfil buscado</label>
            <textarea
              className="config-input"
              name="profile_sought"
              rows={2}
              placeholder="Ej: creadores de gastronomía en CABA, +10k seguidores"
            />
          </div>
          <button type="submit" className="btn btn-solid">
            {isAdmin ? "Crear y publicar" : "Enviar a revisión"}
          </button>
        </form>
      </div>
    </>
  );
}
