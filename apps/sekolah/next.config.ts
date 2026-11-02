import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  // Embed Google Maps (halaman profil/kontak, S2) hanya dari www.google.com.
  async headers() {
    return [
      ...nextSecurityHeaders({ frameSrc: ["https://www.google.com"] }),
      // Area admin & API sesi: jangan di-cache browser/proxy, dan jangan diindeks mesin pencari.
      ...["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      })),
    ];
  },
};

export default nextConfig;
