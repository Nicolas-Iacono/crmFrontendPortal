import { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/site";

const PORTAL_URL = getPortalBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/propiedades?*sort=*",
          "/propiedades?*page=*",
          "/propiedades?*size=*",
          "/propiedades?*dir=*",
        ],
      },
    ],
    sitemap: `${PORTAL_URL}/sitemap.xml`,
  };
}
