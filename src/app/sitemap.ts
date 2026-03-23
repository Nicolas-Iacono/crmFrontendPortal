import { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/site";
import { getApiBase } from "@/lib/api-base";

const PORTAL_URL = getPortalBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: PORTAL_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${PORTAL_URL}/propiedades`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${PORTAL_URL}/propiedades?operacion=VENTA`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${PORTAL_URL}/propiedades?operacion=ALQUILER`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ];

  let propertyPages: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${getApiBase()}/api/public/propiedades?size=1000&page=0`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      propertyPages = data.content.map((p: { slug: string; fechaPublicacion?: string }) => ({
        url: `${PORTAL_URL}/propiedad/${p.slug}`,
        lastModified: p.fechaPublicacion ? new Date(p.fechaPublicacion) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // silent - sitemap still works with static pages
  }

  return [...staticPages, ...propertyPages];
}
