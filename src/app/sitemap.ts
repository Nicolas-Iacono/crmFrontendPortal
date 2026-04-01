import { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/site";
import { getApiBase } from "@/lib/api-base";
import { buildSeoListingSlug } from "@/lib/seoListings";

const PORTAL_URL = getPortalBaseUrl();

/** Landings SEO: localidad × operación × (sin tipo | Casa | Departamento) */
function buildSeoLandingUrls(localidades: string[]): MetadataRoute.Sitemap {
  const tipos: (string | undefined)[] = [undefined, "Casa", "Departamento"];
  const ops = ["VENTA", "ALQUILER"] as const;
  const out: MetadataRoute.Sitemap = [];
  for (const loc of localidades.slice(0, 80)) {
    for (const op of ops) {
      for (const tipo of tipos) {
        try {
          const slug = buildSeoListingSlug({ operacion: op, localidad: loc, tipo });
          out.push({
            url: `${PORTAL_URL}/${slug}`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.85,
          });
        } catch {
          /* localidad vacía, etc. */
        }
      }
    }
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: PORTAL_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${PORTAL_URL}/propiedades`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  ];

  let propertyPages: MetadataRoute.Sitemap = [];
  let seoLandings: MetadataRoute.Sitemap = [];

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

  try {
    const fres = await fetch(`${getApiBase()}/api/public/filtros`, {
      next: { revalidate: 3600 },
    });
    if (fres.ok) {
      const f = await fres.json();
      if (Array.isArray(f.localidades) && f.localidades.length) {
        seoLandings = buildSeoLandingUrls(f.localidades);
      }
    }
  } catch {
    /* sin landings SEO */
  }

  return [...staticPages, ...seoLandings, ...propertyPages];
}
