import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { toko } from "../content/toko";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005"),
  title: { default: `${toko.nama} — ${toko.tagline}`, template: `%s | ${toko.nama}` },
  description: toko.deskripsi,
  applicationName: toko.nama,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={toko.tema}>
      <body>{children}</body>
    </html>
  );
}
