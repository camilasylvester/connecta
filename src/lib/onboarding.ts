export const PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Córdoba",
  "Rosario",
  "Otro",
] as const;

export const INDUSTRIES = [
  "Gastronomía y bebidas",
  "Moda y accesorios",
  "Belleza y cuidado personal",
  "Fitness y bienestar",
  "Turismo y experiencias",
  "Tecnología y servicios digitales",
  "Hogar y decoración",
  "Arte, cultura y entretenimiento",
  "Mascotas",
  "Otro",
] as const;

export const INFLUENCER_EXPERIENCE = [
  "Sí, continuamente",
  "A veces",
  "No, sería la primera vez",
] as const;

export const BRAND_GOALS = [
  "Aumentar visibilidad",
  "Generar contenido para redes",
  "Llegar a nuevos públicos",
  "Posicionarse en determinada zona",
  "Aumentar ventas",
  "Otro",
] as const;

export const CONTENT_THEME_GROUPS: { group: string; options: string[] }[] = [
  {
    group: "Moda",
    options: ["Moda", "Streetwear", "Accesorios / Joyería", "Calzado"],
  },
  {
    group: "Belleza",
    options: ["Belleza", "Cuidado (piel, pelo)", "Perfumes"],
  },
  {
    group: "Lifestyle",
    options: ["Lifestyle", "Running", "Fitness", "Nutrición"],
  },
  {
    group: "Gastronomía",
    options: [
      "Gastronomía",
      "Reseñas de restaurantes / bares",
      "Café y cafeterías",
      "Recetas",
      "Comida saludable",
      "Vinos / Cervezas / Bebidas",
      "Experiencias gastronómicas",
    ],
  },
  {
    group: "Hogar",
    options: ["Decoración", "Arquitectura", "Jardinería"],
  },
  {
    group: "Tecnología",
    options: ["Tecnología", "Apps y redes sociales"],
  },
  {
    group: "Cultura y entretenimiento",
    options: ["Cine y series", "Música", "Arte", "Fotografía"],
  },
  {
    group: "Viajes",
    options: [
      "Viajes",
      "Turismo local",
      "Hoteles y hospedajes",
      "Experiencias y escapadas",
      "Playa / Surf",
      "Montaña / Nieve",
      "Tips de viaje",
    ],
  },
  {
    group: "Negocios",
    options: ["Marketing digital", "Finanzas"],
  },
  {
    group: "Comunidad",
    options: ["Feminismo", "Diversidad e inclusión", "Medio ambiente / Sustentabilidad"],
  },
  {
    group: "Contenido personal",
    options: [
      "Humor",
      "Opiniones / Reflexiones",
      "Storytime / Anécdotas",
      "Entrevistas / Podcasts",
      "Parejas / Relaciones",
      "Otro",
    ],
  },
];

export const PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitch",
  "Otro",
] as const;

export type OnboardingRole = "creator" | "brand";

export type OnboardingPayload = {
  // Sección 1
  fullName: string;
  instagram: string;
  tiktok: string;
  province: string;
  age: string;
  phone: string;
  contactEmail: string;
  role: OnboardingRole;
  // Marca
  brandName: string;
  industry: string;
  companyLocation: string;
  contactPerson: string;
  contactChannel: string;
  influencerExperience: string;
  goals: string[];
  // Creador
  contentThemes: string[];
  platforms: string[];
  /** Profile photo as data URL or remote URL (optional). */
  avatarUrl: string;
  /** Instagram followers (manual). */
  followers: string;
  /** TikTok followers (manual). */
  tiktokFollowers: string;
};

export function emptyOnboarding(
  role: OnboardingRole = "creator"
): OnboardingPayload {
  return {
    fullName: "",
    instagram: "",
    tiktok: "",
    province: "",
    age: "",
    phone: "",
    contactEmail: "",
    role,
    brandName: "",
    industry: "",
    companyLocation: "",
    contactPerson: "",
    contactChannel: "",
    influencerExperience: "",
    goals: [],
    contentThemes: [],
    platforms: [],
    avatarUrl: "",
    followers: "",
    tiktokFollowers: "",
  };
}

export function validateOnboarding(
  data: OnboardingPayload
): { ok: true } | { ok: false; error: string } {
  if (!data.fullName.trim()) return { ok: false, error: "Nombre y apellido es obligatorio" };
  if (!data.instagram.trim()) return { ok: false, error: "Usuario de Instagram es obligatorio" };
  if (!data.province) return { ok: false, error: "Provincia es obligatoria" };
  if (!data.contactEmail.trim() || !data.contactEmail.includes("@")) {
    return { ok: false, error: "Email de contacto válido es obligatorio" };
  }
  if (data.role !== "brand" && data.role !== "creator") {
    return { ok: false, error: "Elegí un perfil" };
  }

  if (data.role === "brand") {
    if (!data.brandName.trim()) return { ok: false, error: "Nombre de la marca es obligatorio" };
    if (!data.industry) return { ok: false, error: "Rubro / Industria es obligatorio" };
    if (!data.companyLocation.trim()) {
      return { ok: false, error: "Ciudad / Provincia de la empresa es obligatoria" };
    }
    if (!data.contactPerson.trim()) {
      return { ok: false, error: "Persona de contacto es obligatoria" };
    }
    if (!data.contactChannel.trim()) {
      return { ok: false, error: "Mail o WhatsApp de contacto es obligatorio" };
    }
    if (!data.influencerExperience) {
      return { ok: false, error: "Indicá si trabajaron antes con influencers" };
    }
    if (data.goals.length === 0) {
      return { ok: false, error: "Elegí al menos un objetivo" };
    }
  }

  if (data.role === "creator") {
    if (data.contentThemes.length === 0) {
      return { ok: false, error: "Elegí al menos una temática" };
    }
    if (data.platforms.length === 0) {
      return { ok: false, error: "Elegí al menos una plataforma" };
    }
  }

  return { ok: true };
}

/** Map a DB profile into the onboarding form shape for editing. */
export function profileToOnboarding(profile: {
  role: string;
  displayName: string | null;
  handle: string | null;
  tiktokHandle: string | null;
  province: string | null;
  city: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  brandName: string | null;
  industry: string | null;
  category: string | null;
  companyLocation: string | null;
  contactPerson: string | null;
  contactChannel: string | null;
  influencerExperience: string | null;
  goals: string[] | null;
  contentThemes: string[] | null;
  platforms: string[] | null;
  avatarUrl?: string | null;
  followers?: number | null;
  tiktokFollowers?: number | null;
}): OnboardingPayload {
  const role: OnboardingRole =
    profile.role === "brand" ? "brand" : "creator";
  return {
    fullName: profile.displayName || "",
    instagram: profile.handle || "",
    tiktok: profile.tiktokHandle || "",
    province: profile.province || "",
    age: profile.age != null ? String(profile.age) : "",
    phone: profile.phone || "",
    contactEmail: profile.email || "",
    role,
    brandName: profile.brandName || "",
    industry: profile.industry || profile.category || "",
    companyLocation: profile.companyLocation || profile.city || "",
    contactPerson: profile.contactPerson || "",
    contactChannel: profile.contactChannel || "",
    influencerExperience: profile.influencerExperience || "",
    goals: Array.isArray(profile.goals) ? profile.goals : [],
    contentThemes: Array.isArray(profile.contentThemes)
      ? profile.contentThemes
      : [],
    platforms: Array.isArray(profile.platforms) ? profile.platforms : [],
    avatarUrl: profile.avatarUrl || "",
    followers:
      profile.followers != null && profile.followers > 0
        ? String(profile.followers)
        : "",
    tiktokFollowers:
      profile.tiktokFollowers != null && profile.tiktokFollowers > 0
        ? String(profile.tiktokFollowers)
        : "",
  };
}
