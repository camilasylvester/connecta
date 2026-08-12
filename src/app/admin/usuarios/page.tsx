import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { AdminSearchBox } from "@/components/AdminSearchBox";
import { InstagramLink } from "@/components/InstagramLink";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role: roleFilter, q: rawQ } = await searchParams;
  const q = (rawQ || "").trim();
  const db = getDb();

  const roleOk =
    roleFilter === "brand" ||
    roleFilter === "creator" ||
    roleFilter === "admin";

  const roleCond = roleOk ? eq(profiles.role, roleFilter) : undefined;

  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const searchCond = q
    ? or(
        ilike(profiles.displayName, pattern),
        ilike(profiles.brandName, pattern),
        ilike(profiles.email, pattern),
        ilike(profiles.handle, pattern),
        ilike(profiles.contactPerson, pattern)
      )
    : undefined;

  const whereClause =
    roleCond && searchCond
      ? and(roleCond, searchCond)
      : roleCond || searchCond;

  const users = whereClause
    ? await db
        .select()
        .from(profiles)
        .where(whereClause)
        .orderBy(desc(profiles.createdAt))
    : await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  function tabHref(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("role", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Usuarios</h1>
          <div className="sub">
            Buscá por nombre, marca, email o Instagram. Tocá una fila para ver
            la ficha.
          </div>
        </div>
      </div>
      <div className="content">
        <div className="toolbar" style={{ marginBottom: 14 }}>
          <AdminSearchBox initialQuery={q} />
        </div>

        <div className="tabs-row">
          {(
            [
              ["", "Todos"],
              ["admin", "Admin"],
              ["brand", "Marcas"],
              ["creator", "Influencers"],
            ] as const
          ).map(([value, label]) => {
            const active = (roleFilter || "") === value;
            return (
              <Link
                key={label}
                href={tabHref(value)}
                className={`tab-pill${active ? " is-active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {q ? (
          <p className="sample-note" style={{ marginBottom: 14 }}>
            Resultados para “{q}”: {users.length}
            {users.length === 1 ? " usuario" : " usuarios"}.{" "}
            <Link href={roleOk ? `/admin/usuarios?role=${roleFilter}` : "/admin/usuarios"}>
              Limpiar búsqueda
            </Link>
          </p>
        ) : null}

        {users.length === 0 ? (
          <div className="empty-state">
            <p>
              {q
                ? "No encontramos marcas ni personas con esa búsqueda."
                : "No hay usuarios en este filtro."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="creator-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Instagram / Marca</th>
                  <th>Email</th>
                  <th>Formulario</th>
                  <th>Alta</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="table-link"
                      >
                        {u.displayName || "—"}
                      </Link>
                    </td>
                    <td>
                      <RolePill role={u.role} />
                    </td>
                    <td className="ct-empty">
                      {u.role === "brand" ? (
                        u.brandName || "—"
                      ) : u.handle ? (
                        <InstagramLink
                          handle={u.handle}
                          className="cell-link"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="ct-empty">{u.email || "—"}</td>
                    <td>
                      {u.onboardingCompleted ? (
                        <span className="status-badge status-ok">Completo</span>
                      ) : (
                        <span className="status-badge status-finalizado">
                          Parcial
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="cell-link"
                      >
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const variants: Record<UserRole, string> = {
    admin: "status-wait",
    brand: "status-activo",
    creator: "status-ok",
  };
  return (
    <span className={`status-badge ${variants[role]}`}>{roleLabel(role)}</span>
  );
}
