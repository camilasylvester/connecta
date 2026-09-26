/**
 * Ubicación en escalera: país → provincia/región → municipio (T-14).
 *
 * Los datos viven en `public/geo/{ar,uy,cl,es}.json` (se generan con
 * `node scripts/build-geo.mjs`) y se bajan recién cuando alguien elige un país.
 * Acá quedan solo los países y la lógica, para que el bundle no cargue los
 * ~10.900 municipios.
 *
 * La usan creadores y marcas. En la base se guarda como `creatorMeta.geo`
 * (jsonb, sin migración; el nombre de la columna es histórico) y además
 * se copia a las columnas viejas `province` / `city` para las pantallas que
 * todavía las leen.
 */

export type GeoCountryCode = "AR" | "UY" | "CL" | "ES";

export type GeoCountry = {
  code: GeoCountryCode;
  name: string;
  /** Cómo se llama el primer nivel en ese país (Provincia, Región...). */
  regionLabel: string;
  /** Cómo se llama el segundo nivel (Municipio, Comuna...). */
  placeLabel: string;
};

export const GEO_COUNTRIES: readonly GeoCountry[] = [
  { code: "AR", name: "Argentina", regionLabel: "Provincia", placeLabel: "Municipio / barrio" },
  { code: "UY", name: "Uruguay", regionLabel: "Departamento", placeLabel: "Municipio / barrio" },
  { code: "CL", name: "Chile", regionLabel: "Región", placeLabel: "Comuna" },
  { code: "ES", name: "España", regionLabel: "Provincia", placeLabel: "Municipio" },
];

export type GeoRegion = { name: string; places: string[] };
export type GeoCountryData = GeoCountry & { regions: GeoRegion[] };

/**
 * Ubicación de una persona. `provincia` y `municipio` pueden venir vacíos en
 * perfiles viejos (por ejemplo, alguien que solo había elegido "Córdoba").
 */
export type GeoUbicacion = {
  pais: GeoCountryCode;
  provincia: string;
  municipio: string;
};

export function geoCountry(code: string | null | undefined): GeoCountry | null {
  return GEO_COUNTRIES.find((c) => c.code === code) || null;
}

const cache = new Map<GeoCountryCode, Promise<GeoCountryData>>();

/** Baja (una sola vez por sesión) las provincias y municipios de un país. */
export function loadGeoCountry(code: GeoCountryCode): Promise<GeoCountryData> {
  let pending = cache.get(code);
  if (!pending) {
    pending = fetch(`/geo/${code.toLowerCase()}.json`).then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar la lista de ubicaciones.");
      return res.json() as Promise<GeoCountryData>;
    });
    // Si falla, se saca del cache para que el próximo intento reintente.
    pending.catch(() => cache.delete(code));
    cache.set(code, pending);
  }
  return pending;
}

// Nombres oficiales largos que en pantalla se leen mejor cortos.
const SHORT_REGION: Record<string, string> = {
  "Ciudad Autónoma de Buenos Aires": "CABA",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "Tierra del Fuego",
};

export function shortRegionName(name: string): string {
  return SHORT_REGION[name] || name;
}

/** "Palermo, CABA, Argentina" — omite los niveles vacíos. */
export function geoLabel(u: GeoUbicacion | null | undefined): string {
  if (!u) return "";
  return [u.municipio, u.provincia && shortRegionName(u.provincia), geoCountry(u.pais)?.name]
    .filter(Boolean)
    .join(", ");
}

/** Versión corta para cards: "Palermo, CABA" o "Madrid, Madrid". */
export function geoShortLabel(u: GeoUbicacion | null | undefined): string {
  if (!u) return "";
  const parts = [u.municipio, u.provincia && shortRegionName(u.provincia)].filter(Boolean);
  return parts.length ? parts.join(", ") : geoCountry(u.pais)?.name || "";
}

export function isCompleteGeo(u: GeoUbicacion | null | undefined): u is GeoUbicacion {
  return Boolean(u && geoCountry(u.pais) && u.provincia.trim() && u.municipio.trim());
}

/** Valida lo que llega del cliente antes de guardarlo. */
export function parseGeo(raw: unknown): GeoUbicacion | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<GeoUbicacion>;
  if (!geoCountry(v.pais)) return null;
  return {
    pais: v.pais as GeoCountryCode,
    provincia: typeof v.provincia === "string" ? v.provincia.trim().slice(0, 120) : "",
    municipio: typeof v.municipio === "string" ? v.municipio.trim().slice(0, 120) : "",
  };
}

/**
 * Traduce la ubicación vieja (6 chips sueltos del registro v3, o la provincia
 * del formulario original) a la escalera nueva. Así los perfiles que ya
 * existen aparecen en los filtros sin tener que migrar la base.
 */
const LEGACY: Record<string, GeoUbicacion> = {
  CABA: { pais: "AR", provincia: "Ciudad Autónoma de Buenos Aires", municipio: "" },
  Palermo: { pais: "AR", provincia: "Ciudad Autónoma de Buenos Aires", municipio: "Palermo" },
  Córdoba: { pais: "AR", provincia: "Córdoba", municipio: "" },
  Rosario: { pais: "AR", provincia: "Santa Fe", municipio: "Rosario" },
  "La Plata": { pais: "AR", provincia: "Buenos Aires", municipio: "La Plata" },
  Mendoza: { pais: "AR", provincia: "Mendoza", municipio: "" },
  "Buenos Aires": { pais: "AR", provincia: "Buenos Aires", municipio: "" },
};

export function legacyToGeo(value: string | null | undefined): GeoUbicacion | null {
  if (!value) return null;
  const hit = LEGACY[value.trim()];
  return hit ? { ...hit } : null;
}

// ---------------------------------------------------------------------------
// Filtro en escalera
//
// Cada selección del filtro es un "camino": "AR", "AR|Córdoba" o
// "AR|Córdoba|Río Cuarto". Regla: manda lo más específico. Si la marca elige
// Argentina y después Córdoba, busca solo en Córdoba (no en toda Argentina);
// si además elige Río Cuarto, solo Río Cuarto. Entre caminos hermanos es OR.
// ---------------------------------------------------------------------------

export const GEO_SEP = "|";

export function geoPath(...parts: string[]): string {
  return parts.join(GEO_SEP);
}

/** Saca los caminos que tienen un descendiente elegido (queda lo más específico). */
export function effectiveGeoSelections(selected: string[]): string[] {
  return selected.filter(
    (path) => !selected.some((other) => other !== path && other.startsWith(path + GEO_SEP))
  );
}

/** ¿La ubicación de la persona cae dentro de lo que eligió la marca? */
export function matchesGeoFilter(u: GeoUbicacion | null, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (!u) return false;
  const own = [u.pais, u.provincia, u.municipio].filter(Boolean);
  return effectiveGeoSelections(selected).some((path) => {
    const want = path.split(GEO_SEP);
    // Un perfil sin municipio no puede confirmar que esté en uno puntual.
    if (want.length > own.length) return false;
    return want.every((part, i) => part === own[i]);
  });
}

/** Al destildar un nivel se van también sus hijos (no quedan filtros huérfanos). */
export function removeGeoPath(selected: string[], path: string): string[] {
  return selected.filter((p) => p !== path && !p.startsWith(path + GEO_SEP));
}

/** Texto corto de una selección del filtro, para las pastillas. */
export function geoPathLabel(path: string): string {
  const [code, provincia, municipio] = path.split(GEO_SEP);
  if (municipio) return municipio;
  if (provincia) return shortRegionName(provincia);
  return geoCountry(code)?.name || code;
}
