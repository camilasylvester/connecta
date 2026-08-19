import { and, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { applications, profiles } from "@/db/schema";
import { profileToSearchCard } from "@/lib/creator-search";
import { CreatorExplorer } from "./CreatorExplorer";

export default async function ExplorarPage() {
  const db = getDb();
  const creators = await db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.role, "creator"), eq(profiles.accountStatus, "approved"))
    );

  const ids = creators.map((c) => c.id);
  const collabRows =
    ids.length === 0
      ? []
      : await db
          .select({
            creatorId: applications.creatorId,
            total: sql<number>`count(*)::int`,
          })
          .from(applications)
          .where(
            and(
              inArray(applications.creatorId, ids),
              eq(applications.status, "approved")
            )
          )
          .groupBy(applications.creatorId);

  const collabMap = new Map(
    collabRows.map((r) => [r.creatorId, Number(r.total) || 0])
  );

  const cards = creators.map((c) =>
    profileToSearchCard(c, collabMap.get(c.id) || 0)
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Explorar</h1>
          <div className="sub">
            Buscá creadores con los 8 filtros. AND entre bloques, OR adentro de
            cada uno.
          </div>
        </div>
      </div>
      <div className="content">
        <div className="tabs-row">
          <Link href="/dashboard/creadores" className="tab-pill">
            Mi CRM
          </Link>
          <Link href="/dashboard/explorar" className="tab-pill is-active">
            Explorar
          </Link>
        </div>
        <CreatorExplorer creators={cards} />
      </div>
    </>
  );
}
