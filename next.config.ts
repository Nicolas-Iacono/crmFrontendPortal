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
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
