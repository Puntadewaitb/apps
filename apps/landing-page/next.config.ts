import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";
import { trackingConfig, trackingCsp } from "./lib/tracking";

// Origin GA4 / Meta Pixel hanya ditambahkan ke CSP bila ID-nya diisi di env.
const csp = trackingCsp(trackingConfig());

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Tambah origin di sini bila memakai embed (mis. frameSrc: ["https://www.google.com"]).
    return [
      ...nextSecurityHeaders(csp),
      {
        // Gambar demo: cache 7 hari (nama file tidak ber-hash).
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
