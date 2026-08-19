import type { OnboardingPayload } from "@/lib/onboarding";
import { normalizeInstagramHandle } from "@/lib/instagram";

export const UBICACION_OPTIONS = [
  "CABA",
  "Palermo",
  "Córdoba",
  "Rosario",
  "La Plata",
  "Mendoza",
] as const;

export const GENERO_OPTIONS = ["Mujer", "Hombre", "Otro"] as const;

export const IDIOMA_OPTIONS = [
  "Español",
  "Inglés",
  "Portugués",
  "Francés",
  "Chino",
] as const;

export const PLATAFORMA_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter/X",
  "Twitch",
  "Kick",
] as const;

export const CATEGORY_TREE: Record<string, string[]> = {
  Moda: [
    "Streetwear",
    "Formal / oficina",
    "Sustentable / segunda mano",
    "Calzado y sneakers",
    "Accesorios y joyería",
    "Plus size",
    "Diseño de autor",
  ],
  Belleza: [
    "Skincare",
    "Maquillaje",
    "Haircare",
    "Uñas",
    "Fragancias",
    "Cuidado masculino / grooming",
    "Tratamientos estéticos",
  ],
  Lifestyle: [
    "Hogar y decoración",
    "Organización y minimalismo",
    "Rutinas y hábitos",
    "Vida sustentable",
    "Lifestyle de lujo",
  ],
  Gastronomía: [
    "Cocina casera",
    "Reviews de restaurantes y bares",
    "Repostería",
    "Coctelería y bebidas",
    "Dietas especiales",
    "Comida callejera / delivery",
  ],
  Viajes: [
    "Mochilero / low cost",
    "Lujo",
    "En familia",
    "Nacional",
    "Internacional",
    "Van life / camping",
  ],
  Tecnología: [
    "Gadgets y reviews",
    "Software y apps",
    "Inteligencia artificial",
    "Equipo fotográfico",
    "Ciencia e innovación",
  ],
  Finanzas: [
    "Educación financiera",
    "Inversiones",
    "Emprendimiento",
    "Cripto",
    "Ahorro y finanzas personales",
  ],
  "Maternidad y familia": [
    "Embarazo",
    "Crianza",
    "Productos para bebés",
    "Familia numerosa",
    "Paternidad",
  ],
  "Fitness y bienestar": [
    "Entrenamiento de fuerza",
    "Funcional / CrossFit",
    "Cardio y running de entrenamiento",
    "Yoga",
    "Pilates",
    "Nutrición deportiva",
    "Nutrición y alimentación saludable",
    "Fitness femenino",
    "Wellness general",
    "Meditación / mindfulness",
    "Salud mental",
    "Sueño y descanso",
    "Biohacking",
  ],
  Deportes: [
    "Fútbol",
    "Pádel",
    "Tenis",
    "Running / Atletismo",
    "Ciclismo",
    "Natación",
    "Surf",
    "Buceo",
    "Trekking / Montañismo",
    "Esquí / Snowboard",
    "Automovilismo",
    "Motociclismo",
    "Boxeo",
    "Artes marciales / MMA",
    "Básquet",
    "Vóley",
    "Rugby",
    "Hockey",
    "Golf",
    "Polo",
    "Skate",
    "Otros deportes",
  ],
  Fotografía: [
    "Retrato",
    "Producto / still life",
    "Viajes",
    "Bodas y eventos",
    "Urbana / callejera",
  ],
  Música: ["DJ / electrónica", "Instrumentistas", "Cantantes / covers", "Producción musical"],
  Arte: ["Ilustración", "Pintura", "Escultura / arte objeto", "Arte digital", "Tatuaje"],
  Diseño: ["Interiorismo", "Diseño gráfico", "Arquitectura", "UX/UI"],
  Gaming: ["Streaming", "Reviews de juegos", "Esports", "Mobile gaming", "Retro gaming"],
  "Humor y entretenimiento": [
    "Sketches",
    "Stand up",
    "Imitaciones / parodias",
    "Reacciones y comentario",
  ],
  Mascotas: ["Perros", "Gatos", "Mascotas exóticas", "Adopción y rescate"],
  "Autos y motos": [
    "Autos clásicos",
    "Modificados / tuning",
    "Motos",
    "Reviews y test drives",
  ],
  Leyes: [
    "Derecho laboral",
    "Derecho del consumidor",
    "Trámites y gestiones",
    "Derecho de familia",
    "Derecho tributario",
  ],
  Educación: [
    "Idiomas",
    "Cursos online / capacitación",
    "Docencia y tips de estudio",
    "Educación infantil",
    "Preparación de exámenes / ingreso",
  ],
  "Cine, series y streaming": [
    "Reviews de películas",
    "Reviews de series",
    "Recomendaciones / rankings",
    "Detrás de escena",
    "Cultura pop",
  ],
  "Libros y lectura": [
    "Booktok / reseñas",
    "Recomendaciones por género",
    "Clubes de lectura",
    "Escritura y autores independientes",
  ],
  "Espiritualidad y astrología": ["Tarot", "Astrología", "Esoterismo", "Rituales y sanación"],
  "Jardinería y plantas": [
    "Plantas de interior",
    "Huerta y cultivo",
    "Paisajismo",
    "Cuidado de jardín",
  ],
  "Vinos y cervezas artesanales": [
    "Vinos",
    "Cervezas artesanales",
    "Coctelería premium",
    "Maridaje",
  ],
};

export type CreatorRegistroV3Draft = {
  nombre: string;
  ubicacion: string | null;
  genero: string | null;
  idiomas: string[];
  categoriaSet: string[];
  redes: Record<string, number>;
  instagram: string;
};

export const CREATOR_DRAFT_STORAGE_KEY = "connecta-creator-draft";

export function emptyCreatorDraft(instagram = ""): CreatorRegistroV3Draft {
  return {
    nombre: "",
    ubicacion: null,
    genero: null,
    idiomas: [],
    categoriaSet: [],
    redes: {},
    instagram,
  };
}

export function v3DraftToOnboarding(draft: CreatorRegistroV3Draft): OnboardingPayload {
  const contentThemes = draft.categoriaSet.map((key) => {
    const [cat, sub] = key.split("|");
    return sub ? `${cat} · ${sub}` : cat;
  });

  const platforms = Object.keys(draft.redes);
  const instagramFollowers = draft.redes.Instagram ?? 0;
  const tiktokFollowers = draft.redes.TikTok ?? 0;

  const province =
    draft.ubicacion === "Palermo"
      ? "CABA"
      : draft.ubicacion === "CABA"
        ? "CABA"
        : draft.ubicacion === "Córdoba"
          ? "Córdoba"
          : draft.ubicacion === "Rosario"
            ? "Otro"
            : draft.ubicacion === "La Plata"
              ? "Buenos Aires"
              : draft.ubicacion === "Mendoza"
                ? "Otro"
                : "Otro";

  return {
    fullName: draft.nombre.trim(),
    instagram: normalizeInstagramHandle(draft.instagram) || draft.instagram.trim(),
    tiktok: "",
    province,
    age: "",
    phone: "",
    contactEmail: "",
    role: "creator",
    brandName: "",
    industry: "",
    companyLocation: "",
    contactPerson: "",
    contactChannel: "",
    influencerExperience: "",
    goals: [],
    contentThemes,
    platforms,
    avatarUrl: "",
    followers: instagramFollowers > 0 ? String(instagramFollowers) : "",
    tiktokFollowers: tiktokFollowers > 0 ? String(tiktokFollowers) : "",
    ubicacion: draft.ubicacion,
    genero: draft.genero,
    idiomas: draft.idiomas,
    categoriaSet: draft.categoriaSet,
    redes: draft.redes,
  };
}

export type CreatorMeta = {
  ubicacion: string | null;
  genero: string | null;
  idiomas: string[];
  categoriaSet: string[];
  redes: Record<string, number>;
};

export function emptyCreatorMeta(): CreatorMeta {
  return {
    ubicacion: null,
    genero: null,
    idiomas: [],
    categoriaSet: [],
    redes: {},
  };
}

export function themeToCategoriaKey(theme: string): string | null {
  const trimmed = theme.trim();
  if (!trimmed) return null;
  if (trimmed.includes("|")) return trimmed;
  const parts = trimmed.split(" · ").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}|${parts.slice(1).join(" · ")}`;
  return null;
}

export function payloadToCreatorMeta(data: OnboardingPayload): CreatorMeta {
  const categoriaSet =
    Array.isArray(data.categoriaSet) && data.categoriaSet.length > 0
      ? data.categoriaSet
      : (data.contentThemes || [])
          .map(themeToCategoriaKey)
          .filter((key): key is string => Boolean(key));

  const redes: Record<string, number> =
    data.redes && Object.keys(data.redes).length > 0
      ? { ...data.redes }
      : {};
  const ig = Number(String(data.followers || "").replace(/\D/g, "")) || 0;
  const tt = Number(String(data.tiktokFollowers || "").replace(/\D/g, "")) || 0;
  if (ig > 0 && redes.Instagram == null) redes.Instagram = ig;
  if (tt > 0 && redes.TikTok == null) redes.TikTok = tt;
  for (const platform of data.platforms || []) {
    if (redes[platform] == null) redes[platform] = platform === "Instagram" ? ig : platform === "TikTok" ? tt : 0;
  }

  return {
    ubicacion: data.ubicacion || null,
    genero: data.genero || null,
    idiomas: Array.isArray(data.idiomas) ? data.idiomas : [],
    categoriaSet,
    redes,
  };
}

export function profileToCreatorDraft(data: OnboardingPayload): CreatorRegistroV3Draft {
  const meta = payloadToCreatorMeta(data);
  return {
    nombre: data.fullName,
    instagram: data.instagram,
    ubicacion: meta.ubicacion,
    genero: meta.genero,
    idiomas: meta.idiomas,
    categoriaSet: meta.categoriaSet,
    redes: meta.redes,
  };
}

export function parseCreatorMeta(raw: unknown): CreatorMeta {
  const empty = emptyCreatorMeta();
  if (!raw || typeof raw !== "object") return empty;
  const value = raw as Partial<CreatorMeta>;
  return {
    ubicacion: typeof value.ubicacion === "string" ? value.ubicacion : null,
    genero: typeof value.genero === "string" ? value.genero : null,
    idiomas: Array.isArray(value.idiomas)
      ? value.idiomas.filter((x): x is string => typeof x === "string")
      : [],
    categoriaSet: Array.isArray(value.categoriaSet)
      ? value.categoriaSet.filter((x): x is string => typeof x === "string")
      : [],
    redes:
      value.redes && typeof value.redes === "object" && !Array.isArray(value.redes)
        ? Object.fromEntries(
            Object.entries(value.redes).map(([k, v]) => [k, Number(v) || 0])
          )
        : {},
  };
}

export function saveCreatorDraft(draft: CreatorRegistroV3Draft) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(draft);
  try {
    localStorage.setItem(CREATOR_DRAFT_STORAGE_KEY, payload);
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.setItem(CREATOR_DRAFT_STORAGE_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function loadCreatorDraft(): CreatorRegistroV3Draft | null {
  if (typeof window === "undefined") return null;
  const raw =
    sessionStorage.getItem(CREATOR_DRAFT_STORAGE_KEY) ||
    localStorage.getItem(CREATOR_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CreatorRegistroV3Draft>;
    const instagram =
      typeof parsed.instagram === "string" ? parsed.instagram : "";
    return {
      ...emptyCreatorDraft(instagram),
      nombre: typeof parsed.nombre === "string" ? parsed.nombre : "",
      ubicacion: parsed.ubicacion || null,
      genero: parsed.genero || null,
      idiomas: Array.isArray(parsed.idiomas) ? parsed.idiomas : [],
      categoriaSet: Array.isArray(parsed.categoriaSet)
        ? parsed.categoriaSet
        : [],
      redes:
        parsed.redes && typeof parsed.redes === "object" ? parsed.redes : {},
      instagram,
    };
  } catch {
    return null;
  }
}

export function clearCreatorDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CREATOR_DRAFT_STORAGE_KEY);
  localStorage.removeItem(CREATOR_DRAFT_STORAGE_KEY);
}
