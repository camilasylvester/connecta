import type { MetadataRoute } from "next";

const siteUrl = "https://www.connectainf.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/eventos",
        "/terminos",
        "/privacidad",
        "/defensa-del-consumidor",
        "/seguridad",
        "/contacto",
      ],
      disallow: [
        "/admin",
        "/dashboard",
        "/after-auth",
        "/completar-perfil",
        "/crear-contrasena",
        "/pendiente",
        "/rechazado",
        "/mi-perfil",
        "/mis-postulaciones",
        "/sso-callback",
        "/aplicar",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
