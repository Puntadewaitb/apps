import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getActiveEvent } from "../lib/event";
import { resolveTema, TEMA_DEFAULT } from "../lib/tema";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003"),
  title: "Undangan Digital",
  description: "Undangan digital.",
  robots: { index: false, follow: false }, // undangan bersifat pribadi
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Tema html mengikuti acara aktif; bila DB bermasalah, jangan sampai halaman error ikut rusak.
  const tema = await getActiveEvent()
    .then((ev) => resolveTema(ev?.tema))
    .catch(() => TEMA_DEFAULT);
  return (
    <html lang="id" data-theme={tema}>
      <body>{children}</body>
    </html>
  );
}
