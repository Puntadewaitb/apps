import type { ReactNode } from "react";
import { Footer, Navbar, WhatsAppButton } from "@tpl/ui";
import { sekolah } from "../content/sekolah";

/** Navbar + Footer + tombol WhatsApp + tautan lewati-ke-konten (WCAG 2.4.1). */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Langsung ke konten utama
      </a>
      <Navbar brand={sekolah.nama} links={sekolah.nav} />
      {children}
      <Footer
        brand={sekolah.nama}
        description={sekolah.footer.deskripsi}
        links={sekolah.footer.tautan}
        copyright={`© ${new Date().getFullYear()} ${sekolah.nama}. Sekolah fiktif untuk demo template.`}
      />
      <WhatsAppButton phone={sekolah.kontak.whatsapp} message={sekolah.kontak.pesanWhatsapp} />
    </>
  );
}
