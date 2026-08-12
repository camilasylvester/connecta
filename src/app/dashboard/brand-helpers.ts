import type { EventStatus } from "@/lib/types";

const POSTERS = ["p1", "p2", "p3", "p4", "p5", "p6"] as const;
const AVATAR_COLORS = [
  "#6F6AE0",
  "#9C98EC",
  "#4C4894",
  "#8683CC",
  "#3E3A85",
] as const;

export function posterClass(seed: string): (typeof POSTERS)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % POSTERS.length;
  }
  return POSTERS[hash];
}

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

export function statusMeta(status: EventStatus): {
  label: string;
  className: string;
  filter: "activos" | "finalizados" | "borradores";
} {
  if (status === "active") {
    return {
      label: "Activo",
      className: "status-activo",
      filter: "activos",
    };
  }
  if (status === "closed") {
    return {
      label: "Finalizado",
      className: "status-finalizado",
      filter: "finalizados",
    };
  }
  return {
    label: "Pendiente de aprobación",
    className: "status-wait",
    filter: "borradores",
  };
}

export function formatEventDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEventDateLong(iso: string | null): string {
  if (!iso) return "Sin fecha";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function initialsFromName(name: string): string {
  const clean = name.replace("@", "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}
