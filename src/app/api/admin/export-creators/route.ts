import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { buildCsv } from "@/lib/csv-export";
import type { AccountStatus } from "@/db/schema";

const VALID_STATUSES: AccountStatus[] = ["approved", "pending", "rejected"];

function parseStatus(raw: string | null): AccountStatus | "all" {
  if (raw === "all") return "all";
  if (raw && VALID_STATUSES.includes(raw as AccountStatus)) {
    return raw as AccountStatus;
  }
  return "approved";
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusFilter = parseStatus(url.searchParams.get("status"));

  const db = getDb();
  const rows =
    statusFilter === "all"
      ? await db
          .select()
          .from(profiles)
          .where(eq(profiles.role, "creator"))
          .orderBy(asc(profiles.displayName))
      : await db
          .select()
          .from(profiles)
          .where(
            and(
              eq(profiles.role, "creator"),
              eq(profiles.accountStatus, statusFilter)
            )
          )
          .orderBy(asc(profiles.displayName));

  const headers = [
    "nombre",
    "email",
    "telefono",
    "instagram",
    "tiktok",
    "provincia",
    "estado_cuenta",
    "ficha_completa",
    "fecha_alta",
  ];

  const data = rows.map((c) => [
    c.displayName || "",
    c.email || "",
    c.phone || "",
    c.handle || "",
    c.tiktokHandle || "",
    c.province || "",
    c.accountStatus,
    c.onboardingCompleted ? "si" : "no",
    formatDate(c.createdAt),
  ]);

  const csv = buildCsv(headers, data);
  const suffix =
    statusFilter === "all" ? "todas" : statusFilter;
  const filename = `connecta-creadoras-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
