import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "../components/SiteShell";
import { sekolah } from "../content/sekolah";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004"),
  title: { default: `${sekolah.nama} — ${sekolah.tagline}`, template: `%s | ${sekolah.nama}` },
  description: sekolah.deskripsi,
  applicationName: sekolah.nama,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={sekolah.tema}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
