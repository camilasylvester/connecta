import {
  CATEGORY_TREE,
  GENERO_OPTIONS,
  IDIOMA_OPTIONS,
  PLATAFORMA_OPTIONS,
  UBICACION_OPTIONS,
  parseCreatorMeta,
  themeToCategoriaKey,
  type CreatorMeta,
} from "@/lib/creator-registro-v3";
import type { Profile } from "@/db/schema";

export const SEGUIDORES_BUCKETS = [
  { key: "1-5k", label: "1 - 5.000", min: 1, max: 5000 },
  { key: "5-15k", label: "5.000 - 15.000", min: 5000, max: 15000 },
  { key: "15-30k", label: "15.000 - 30.000", min: 15000, max: 30000 },
  { key: "30-50k", label: "30.000 - 50.000", min: 30000, max: 50000 },
  { key: "50-100k", label: "50.000 - 100.000", min: 50000, max: 100000 },
  { key: "100-300k", label: "100.000 - 300.000", min: 100000, max: 300000 },
  { key: "300-500k", label: "300.000 - 500.000", min: 300000, max: 500000 },
  { key: "500k-1m", label: "500.000 - 1.000.000", min: 500000, max: 1000000 },
  { key: "1m+", label: "1.000.000+", min: 1000000, max: Number.POSITIVE_INFINITY },
] as const;

export const COLABORACIONES_BUCKETS = [
  { key: "1-5", label: "1 - 5", min: 1, max: 5 },
  { key: "5-10", label: "5 - 10", min: 5, max: 10 },
  { key: "10-20", label: "10 - 20", min: 10, max: 20 },
  { key: "20-50", label: "20 - 50", min: 20, max: 50 },
  { key: "50+", label: "50 o +", min: 50, max: Number.POSITIVE_INFINITY },
] as const;

export const PUNTUACION_OPTIONS = [
  { key: "4+", label: "4+ estrellas" },
  { key: "3+", label: "3+ estrellas" },
  { key: "sin", label: "Sin reviews todavía" },
] as const;

export type PuntuacionFilter = (typeof PUNTUACION_OPTIONS)[number]["key"] | null;

export type CreatorSearchFilters = {
  seguidores: string[];
  ubicacion: string[];
  genero: string[];
  idioma: string[];
  categoriaSet: string[];
  colaboraciones: string[];
  plataforma: string[];
  puntuacion: PuntuacionFilter;
};

export const EMPTY_CREATOR_FILTERS: CreatorSearchFilters = {
  seguidores: [],
  ubicacion: [],
  genero: [],
  idioma: [],
  categoriaSet: [],
  colaboraciones: [],
  plataforma: [],
  puntuacion: null,
};

export type CreatorSearchCard = {
  id: string;
  name: string;
  handle: string | null;
  category: string;
  subnicho: string;
  zona: string;
  seguidores: number;
  plataformas: string[];
  genero: string | null;
  idiomas: string[];
  categoriaSet: string[];
  redes: Record<string, number>;
  colaboraciones: number;
  puntuacion: number;
  trending: boolean;
};

export function hydrateCreatorMeta(profile: Profile): CreatorMeta {
  const stored = parseCreatorMeta(profile.creatorMeta);
  const themes = Array.isArray(profile.contentThemes) ? profile.contentThemes : [];
  const fromThemes = themes
    .map(themeToCategoriaKey)
    .filter((key): key is string => Boolean(key));
  const categoriaSet =
    stored.categoriaSet.length > 0 ? stored.categoriaSet : fromThemes;

  const redes = { ...stored.redes };
  const ig = profile.followers || 0;
  const tt = profile.tiktokFollowers || 0;
  if (ig > 0 && redes.Instagram == null) redes.Instagram = ig;
  if (tt > 0 && redes.TikTok == null) redes.TikTok = tt;
  const platforms = Array.isArray(profile.platforms) ? profile.platforms : [];
  for (const platform of platforms) {
    if (redes[platform] == null) {
      redes[platform] =
        platform === "Instagram" ? ig : platform === "TikTok" ? tt : 0;
    }
  }

  const zonaCandidate = stored.ubicacion || profile.city || profile.province;
  const ubicacion =
    stored.ubicacion ||
    (zonaCandidate &&
    (UBICACION_OPTIONS as readonly string[]).includes(zonaCandidate)
      ? zonaCandidate
      : null);

  return {
    ubicacion,
    genero: stored.genero,
    idiomas: stored.idiomas,
    categoriaSet,
    redes,
  };
}

function bucketMatch(
  buckets: readonly { key: string; min: number; max: number }[],
  selectedKeys: string[],
  value: number
): boolean {
  const set = new Set(selectedKeys);
  return buckets.some((b) => set.has(b.key) && value >= b.min && value < b.max);
}

function followerValues(redes: Record<string, number>, plataformas: string[]): number[] {
  const selected = plataformas.length
    ? plataformas.filter((p) => Object.hasOwn(redes, p))
    : Object.keys(redes);
  const counts = selected.map((p) => redes[p] || 0);
  if (counts.length > 0) return counts;
  return [0];
}

export function profileToSearchCard(
  profile: Profile,
  colaboraciones: number
): CreatorSearchCard {
  const meta = hydrateCreatorMeta(profile);
  const firstKey = meta.categoriaSet[0] || "";
  const [category = "", subnicho = ""] = firstKey.split("|");
  const plataformas = Object.keys(meta.redes).filter((p) => (meta.redes[p] || 0) > 0);
  const seguidores = Math.max(0, ...Object.values(meta.redes), 0);
  const name = profile.displayName || profile.handle || "Creador";

  return {
    id: profile.id,
    name,
    handle: profile.handle,
    category: category || profile.category || "Creador",
    subnicho,
    zona: meta.ubicacion || profile.city || profile.province || "",
    seguidores,
    plataformas,
    genero: meta.genero,
    idiomas: meta.idiomas,
    categoriaSet: meta.categoriaSet,
    redes: meta.redes,
    colaboraciones,
    puntuacion: 0,
    trending: colaboraciones >= 10,
  };
}

export function anyCreatorFilterActive(filters: CreatorSearchFilters): boolean {
  return Boolean(
    filters.seguidores.length ||
      filters.ubicacion.length ||
      filters.genero.length ||
      filters.idioma.length ||
      filters.categoriaSet.length ||
      filters.colaboraciones.length ||
      filters.plataforma.length ||
      filters.puntuacion
  );
}

export function matchesCreatorFilters(
  card: CreatorSearchCard,
  filters: CreatorSearchFilters
): boolean {
  if (!anyCreatorFilterActive(filters)) return true;

  if (filters.seguidores.length) {
    const values = followerValues(card.redes, filters.plataforma);
    const ok = values.some((n) =>
      bucketMatch(SEGUIDORES_BUCKETS, filters.seguidores, n)
    );
    if (!ok) return false;
  }
  if (filters.ubicacion.length && !filters.ubicacion.includes(card.zona)) {
    return false;
  }
  if (filters.genero.length && (!card.genero || !filters.genero.includes(card.genero))) {
    return false;
  }
  if (
    filters.idioma.length &&
    !card.idiomas.some((lang) => filters.idioma.includes(lang))
  ) {
    return false;
  }
  if (filters.categoriaSet.length) {
    const set = new Set(filters.categoriaSet);
    if (!card.categoriaSet.some((key) => set.has(key))) return false;
  }
  if (
    filters.colaboraciones.length &&
    !bucketMatch(COLABORACIONES_BUCKETS, filters.colaboraciones, card.colaboraciones)
  ) {
    return false;
  }
  if (
    filters.plataforma.length &&
    !filters.plataforma.some(
      (p) => card.plataformas.includes(p) || Object.hasOwn(card.redes, p)
    )
  ) {
    return false;
  }
  if (filters.puntuacion === "4+" && !(card.puntuacion >= 4)) return false;
  if (filters.puntuacion === "3+" && !(card.puntuacion >= 3)) return false;
  if (filters.puntuacion === "sin" && card.puntuacion !== 0) return false;
  return true;
}

export function matchesSearchTerm(card: CreatorSearchCard, term: string): boolean {
  if (!term) return true;
  const hay = [
    card.name,
    card.handle || "",
    card.category,
    card.subnicho,
    card.zona,
    ...card.categoriaSet,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(term.toLowerCase());
}

export const SEARCH_UBICACIONES = UBICACION_OPTIONS;
export const SEARCH_GENEROS = GENERO_OPTIONS;
export const SEARCH_IDIOMAS = IDIOMA_OPTIONS;
export const SEARCH_PLATAFORMAS = PLATAFORMA_OPTIONS;
export { CATEGORY_TREE };
