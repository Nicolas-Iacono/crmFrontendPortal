import { MetadataRoute } from "next";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.tuinmo.com";

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
