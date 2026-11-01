import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Tambah origin di sini bila memakai embed (mis. frameSrc: ["https://www.google.com"]).
    return nextSecurityHeaders();
  },
};

export default nextConfig;
