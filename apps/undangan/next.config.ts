import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";
import { undangan } from "./content/undangan";
import { parseYoutubeId } from "./lib/video";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  async headers() {
    // Embed Google Maps (lihat lib/maps.ts: hanya URL embed www.google.com yang dirender).
    // Frame YouTube (nocookie) hanya diizinkan bila video diisi di content/undangan.ts.
    const frameSrc = ["https://www.google.com"];
    if (parseYoutubeId(undangan.video.youtube)) frameSrc.push("https://www.youtube-nocookie.com");
    return nextSecurityHeaders({ frameSrc });
  },
};

export default nextConfig;
