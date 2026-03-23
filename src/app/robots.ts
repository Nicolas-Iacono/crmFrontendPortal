import { MetadataRoute } from "next";
import { getPortalBaseUrl } from "@/lib/site";

const PORTAL_URL = getPortalBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${PORTAL_URL}/sitemap.xml`,
  };
}
