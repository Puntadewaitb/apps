import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  // Embed Google Maps (halaman profil/kontak, S2) hanya dari www.google.com.
  async headers() {
    return nextSecurityHeaders({ frameSrc: ["https://www.google.com"] });
  },
};

export default nextConfig;
