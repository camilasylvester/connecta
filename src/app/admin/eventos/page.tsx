import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AdminApproveEventButton } from "@/components/AdminApproveEventButton";
import { AdminDeleteEventButton } from "@/components/AdminDeleteEventButton";
import { getDb } from "@/db";
import { events, profiles } from "@/db/schema";

export default async function AdminEventsPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      status: events.status,
      quota: events.quota,
      imageUrls: events.imageUrls,
      brandName: profiles.brandName,
    })
    .from(events)
    .leftJoin(profiles, eq(events.brandId, profiles.id))
    .orderBy(desc(events.createdAt));

  const pending = rows.filter((r) => r.status === "draft");
  const others = rows.filter((r) => r.status !== "draft");

  function statusLabel(status: string) {
    if (status === "active") return "Activo";
    if (status === "closed") return "Cerrado";
    return "Pendiente";
  }

  function EventTable({
    list,
    showApprove,
  }: {
    list: typeof rows;
    showApprove?: boolean;
  }) {
    if (list.length === 0) {
      return (
        <div className="empty-state">
          <p>
            {showApprove
              ? "No hay eventos esperando aprobación."
              : "Todavía no hay eventos."}
          </p>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table className="creator-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Marca</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Cupos</th>
              <th>Imágenes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((ev) => {
              const images = Array.isArray(ev.imageUrls) ? ev.imageUrls : [];
              return (
                <tr key={ev.id}>
                  <td>
                    <Link
                      href={`/dashboard/eventos/${ev.id}?tab=evento`}
                      className="table-link"
                    >
                      {ev.title}
                    </Link>
                  </td>
                  <td className="ct-empty">{ev.brandName || "—"}</td>
                  <td className="ct-empty">
                    {ev.eventDate
                      ? new Date(
                          ev.eventDate + "T12:00:00"
                        ).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        ev.status === "active"
                          ? "status-activo"
                          : ev.status === "closed"
                            ? "status-finalizado"
                            : "status-wait"
                      }`}
                    >
                      {statusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="ct-empty">{ev.quota}</td>
                  <td className="ct-empty">{images.length}</td>
                  <td>
                    <div
                      className="cell-actions"
                      style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                    >
                      {showApprove || ev.status === "draft" ? (
                        <AdminApproveEventButton
                          eventId={ev.id}
                          title={ev.title}
                        />
                      ) : null}
                      <Link
                        href={`/dashboard/eventos/${ev.id}?tab=evento`}
                        className="btn btn-sm btn-outline"
                      >
                        Editar
                      </Link>
                      <AdminDeleteEventButton
                        eventId={ev.id}
                        title={ev.title}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Todos los eventos</h1>
          <div className="sub">
            Aceptá eventos nuevos de marcas, editá o borrá cualquiera
          </div>
        </div>
        <div className="detail-actions">
          <Link href="/dashboard/eventos/nuevo" className="btn btn-solid btn-sm">
            Crear evento
          </Link>
        </div>
      </div>
      <div className="content">
        <div className="attention-box" style={{ marginBottom: 24 }}>
          <h3>Pendientes de aceptación ({pending.length})</h3>
          <EventTable list={pending} showApprove />
        </div>

        <h3 className="section-label" style={{ marginBottom: 12 }}>
          Resto de eventos
        </h3>
        <EventTable list={others} />
      </div>
    </>
  );
}
