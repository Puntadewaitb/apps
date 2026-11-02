import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    return [
      // Embed Google Maps di halaman kontak (lib/maps.ts hanya merender URL embed www.google.com).
      ...nextSecurityHeaders({ frameSrc: ["https://www.google.com"] }),
      {
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
