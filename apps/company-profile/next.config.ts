import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Tambah origin bila memakai embed (mis. frameSrc: ["https://www.google.com"] untuk peta — dipakai di C4).
    return [
      ...nextSecurityHeaders(),
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
