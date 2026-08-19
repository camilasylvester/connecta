import type { MetadataRoute } from "next";

const siteUrl = "https://www.connectainf.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/eventos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
