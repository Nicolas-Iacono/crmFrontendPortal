import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /** Genera `.next/standalone` para Docker (COPY en Dockerfile) */
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/propiedad/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, must-revalidate" }],
      },
      {
        source: "/propiedades",
        headers: [{ key: "Cache-Control", value: "private, no-store, must-revalidate" }],
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "private, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
