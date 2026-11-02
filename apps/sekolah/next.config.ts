import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  // Unggahan gambar lewat server action (maks. 2 MB/gambar; album bisa beberapa gambar sekaligus).
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // Embed Google Maps (halaman profil/kontak, S2) hanya dari www.google.com.
  async headers() {
    return [
      ...nextSecurityHeaders({ frameSrc: ["https://www.google.com"] }),
      // File unggahan: CSP paling ketat (tak boleh menjalankan apa pun bila dibuka sebagai dokumen).
      // Ditaruh SETELAH header global agar menang untuk kunci yang sama.
      {
        source: "/uploads/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }],
      },
      // Dokumen PPDB (privat; hanya admin): CSP serupa.
      {
        source: "/admin/ppdb/dokumen/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }],
      },
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
