import type { NextConfig } from "next";
import { nextSecurityHeaders } from "@tpl/core";

const nextConfig: NextConfig = {
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
  // Unggah gambar produk lewat server action (maks. 2 MB/gambar; beberapa gambar sekaligus).
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
      ...nextSecurityHeaders(),
      // File unggahan: CSP paling ketat. Ditaruh SETELAH header global agar menang untuk kunci yang sama.
      {
        source: "/uploads/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }],
      },
      // Bukti bayar (privat; hanya admin) — viewer dibuat di T7.
      {
        source: "/admin/pesanan/bukti/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }],
      },
      // Area admin, API sesi, dan API pelanggan: jangan di-cache; admin jangan diindeks.
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
