import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Tambah origin bila memakai embed (mis. frameSrc: ["https://www.google.com"] untuk peta).
    return nextSecurityHeaders();
  },
};

export default nextConfig;
