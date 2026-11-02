import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Embed Google Maps (lihat lib/maps.ts: hanya URL embed www.google.com yang dirender).
    return nextSecurityHeaders({ frameSrc: ["https://www.google.com"] });
  },
};

export default nextConfig;
