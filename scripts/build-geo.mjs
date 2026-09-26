// Genera public/geo/{ar,uy,cl,es}.json: país → provincia/región → municipio.
//
// Se corre a mano (`node scripts/build-geo.mjs`) y el resultado se commitea:
// la app nunca depende de estas fuentes en runtime. Cada archivo se baja en el
// navegador recién cuando alguien elige ese país (España sola son ~8.100
// municipios, no conviene meterlos en el bundle).
//
// Fuentes:
// - Argentina: Georef (datos.gob.ar). No tiene municipios para Santa Cruz ni
//   Santiago del Estero → ahí se usan sus localidades. En CABA se usan los 48
//   barrios oficiales en vez de las 15 comunas (la gente dice "Palermo", no
//   "Comuna 14").
// - Uruguay: Wikipedia (Anexo:Municipios de Uruguay, 2025). Las capitales
//   departamentales fuera de Canelones/Maldonado NO son municipios, así que se
//   agregan a mano; en Montevideo se usan los barrios (los municipios son letras).
// - Chile: listado de regiones y comunas de juanbrujo (346 comunas).
// - España: frontid/ComunidadesProvinciasPoblaciones (52 provincias, 8.131 municipios).

import { mkdir, writeFile } from "node:fs/promises";

const OUT_DIR = new URL("../public/geo/", import.meta.url);
const collator = new Intl.Collator("es", { sensitivity: "base" });

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function wikitext(page) {
  const url = `https://es.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    page
  )}&redirects=1&prop=wikitext&format=json&formatversion=2`;
  return (await getJson(url)).parse.wikitext;
}

/** Ordena, saca duplicados y vacíos. */
function tidy(list) {
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))].sort(collator.compare);
}

function country(code, name, regionLabel, placeLabel, regions) {
  const sorted = Object.entries(regions)
    .map(([region, places]) => ({ name: region, places: tidy(places) }))
    .sort((a, b) => collator.compare(a.name, b.name));
  return { code, name, regionLabel, placeLabel, regions: sorted };
}

const CABA = "Ciudad Autónoma de Buenos Aires";
const CABA_BARRIOS = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores",
  "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro",
  "Monserrat", "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda",
  "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero",
  "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo",
  "Vélez Sarsfield", "Versalles", "Villa Crespo", "Villa del Parque",
  "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro",
  "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo",
  "Villa Santa Rita", "Villa Soldati", "Villa Urquiza",
];

async function buildArgentina() {
  const base = "https://apis.datos.gob.ar/georef/api";
  const { provincias } = await getJson(`${base}/provincias?campos=nombre&max=30`);
  const { municipios } = await getJson(
    `${base}/municipios?campos=nombre,provincia.nombre&max=5000`
  );
  const regions = Object.fromEntries(provincias.map((p) => [p.nombre, []]));
  for (const m of municipios) regions[m.provincia.nombre]?.push(m.nombre);
  regions[CABA] = CABA_BARRIOS;
  // Provincias sin municipios en Georef: se completan con localidades.
  for (const [name, list] of Object.entries(regions)) {
    if (list.length > 0) continue;
    const { localidades } = await getJson(
      `${base}/localidades?provincia=${encodeURIComponent(name)}&campos=nombre&max=1000`
    );
    regions[name] = localidades.map((l) => l.nombre);
  }
  return country("AR", "Argentina", "Provincia", "Municipio / barrio", regions);
}

// Capitales departamentales que no son municipio (ver comentario de arriba).
const UY_CAPITALES = {
  Artigas: "Artigas", "Cerro Largo": "Melo", Colonia: "Colonia del Sacramento",
  Durazno: "Durazno", Flores: "Trinidad", Florida: "Florida",
  Lavalleja: "Minas", Paysandú: "Paysandú", "Río Negro": "Fray Bentos",
  Rivera: "Rivera", Rocha: "Rocha", Salto: "Salto", "San José": "San José de Mayo",
  Soriano: "Mercedes", Tacuarembó: "Tacuarembó", "Treinta y Tres": "Treinta y Tres",
};

const UY_DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
  "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
  "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

async function buildUruguay() {
  const text = await wikitext("Anexo:Municipios de Uruguay");
  const regions = Object.fromEntries(UY_DEPARTAMENTOS.map((d) => [d, []]));
  let current = null;
  for (const line of text.split("\n")) {
    const heading = line.match(/^={2,3}\s*(.+?)\s*={2,3}\s*$/);
    if (heading) {
      // La página tiene otras secciones ("Reseña", "Plenario"...): solo
      // cuentan las que son un departamento.
      const name = heading[1].replace(/\[\[|\]\]/g, "");
      current = UY_DEPARTAMENTOS.includes(name) ? name : null;
      continue;
    }
    const row = line.match(/^\|\s*\[\[Municipio de [^|\]]+\|([^\]]+)\]\]/);
    if (row && current) regions[current].push(row[1]);
  }
  // La primera tabla (Artigas) no tiene título "===": sale del primer link.
  if (regions.Artigas.length === 0) {
    const first = [...text.matchAll(/^\|\s*\[\[Municipio de [^|\]]+\|([^\]]+)\]\]/gm)]
      .slice(0, 3)
      .map((m) => m[1]);
    regions.Artigas = first;
  }
  for (const [dep, capital] of Object.entries(UY_CAPITALES)) {
    regions[dep] = [...(regions[dep] || []), capital];
  }
  const mvd = await wikitext("Barrios de Montevideo");
  regions.Montevideo = [...mvd.matchAll(/<br>'''\[\[(?:[^|\]]*\|)?([^\]]+)\]\]'''/g)].map(
    (m) => m[1]
  );
  return country("UY", "Uruguay", "Departamento", "Municipio / barrio", regions);
}

// Nombres de región más cortos y como se dicen en la calle.
const CL_REGION_NAMES = {
  "Región del Libertador Gral. Bernardo O’Higgins": "O'Higgins",
  "Región del Maule": "Maule",
  "Región de Ñuble": "Ñuble",
  "Región del Biobío": "Biobío",
  "Región de la Araucanía": "La Araucanía",
  "Región de Los Ríos": "Los Ríos",
  "Región de Los Lagos": "Los Lagos",
  "Región Aisén del Gral. Carlos Ibáñez del Campo": "Aysén",
  "Región de Magallanes y de la Antártica Chilena": "Magallanes",
  "Región Metropolitana de Santiago": "Metropolitana de Santiago",
};

async function buildChile() {
  const raw = await getText(
    "https://gist.githubusercontent.com/juanbrujo/0fd2f4d126b3ce5a95a7dd1f28b3d8dd/raw/comunas-regiones.json"
  );
  // El archivo arranca con un comentario "//", que no es JSON válido.
  const json = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ""));
  const regions = {};
  for (const r of json.regiones) {
    regions[CL_REGION_NAMES[r.region] || r.region] = r.comunas;
  }
  return country("CL", "Chile", "Región", "Comuna", regions);
}

async function buildSpain() {
  const base =
    "https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/master";
  const provincias = await getJson(`${base}/provincias.json`);
  const poblaciones = await getJson(`${base}/poblaciones.json`);
  const byCode = Object.fromEntries(provincias.map((p) => [p.code, p.label]));
  const regions = Object.fromEntries(provincias.map((p) => [p.label, []]));
  for (const m of poblaciones) regions[byCode[m.parent_code]]?.push(m.label);
  return country("ES", "España", "Provincia", "Municipio", regions);
}

const countries = await Promise.all([
  buildArgentina(),
  buildUruguay(),
  buildChile(),
  buildSpain(),
]);

await mkdir(OUT_DIR, { recursive: true });
for (const c of countries) {
  const places = c.regions.reduce((acc, r) => acc + r.places.length, 0);
  const empty = c.regions.filter((r) => r.places.length === 0).map((r) => r.name);
  if (empty.length) throw new Error(`${c.code}: regiones sin lugares: ${empty.join(", ")}`);
  await writeFile(new URL(`${c.code.toLowerCase()}.json`, OUT_DIR), JSON.stringify(c));
  console.log(`${c.code}: ${c.regions.length} regiones, ${places} lugares`);
}
