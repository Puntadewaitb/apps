import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer, Navbar, WhatsAppButton } from "@tpl/ui";
import { getKonten } from "../lib/konten";
import "./globals.css";

const k = getKonten();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"),
  title: {
    default: `${k.perusahaan.nama} — ${k.perusahaan.tagline}`,
    template: `%s | ${k.perusahaan.nama}`,
  },
  description: k.perusahaan.deskripsi,
  applicationName: k.perusahaan.nama,
  openGraph: {
    title: k.perusahaan.nama,
    description: k.perusahaan.deskripsi,
    siteName: k.perusahaan.nama,
    locale: k.perusahaan.locale,
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={k.tema}>
      <body>
        <Navbar brand={k.perusahaan.nama} links={k.nav} />
        {children}
        <Footer
          brand={k.perusahaan.namaLengkap}
          description={k.footer.deskripsi}
          links={k.footer.tautan}
          copyright={`© ${new Date().getFullYear()} ${k.perusahaan.namaLengkap}. Brand fiktif untuk demo template.`}
        />
        <WhatsAppButton
          phone={k.kontak.whatsapp}
          message={k.kontak.pesanWhatsapp}
          label="Chat via WhatsApp"
        />
      </body>
    </html>
  );
}
