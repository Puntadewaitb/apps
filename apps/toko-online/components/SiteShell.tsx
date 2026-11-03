import type { ReactNode } from "react";
import { Footer, Navbar, WhatsAppButton } from "@tpl/ui";
import { MiniCart } from "./MiniCart";
import { toko } from "../content/toko";
import { getPengaturan } from "../lib/setting";

/** Navbar + Footer + tombol WhatsApp + tautan lewati-ke-konten (WCAG 2.4.1). Nama/WA dari pengaturan toko (DB). */
export async function SiteShell({ children }: { children: ReactNode }) {
  const s = await getPengaturan();
  const nama = s.nama || toko.nama;
  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Langsung ke konten utama
      </a>
      <Navbar brand={<a href="/">{nama}</a>} links={toko.nav} actions={<MiniCart />} />
      {children}
      <Footer
        brand={nama}
        description={s.tagline || toko.tagline}
        links={toko.nav}
        copyright={`© ${new Date().getFullYear()} ${nama}. Toko fiktif untuk demo template.`}
      />
      {s.whatsapp && (
        <WhatsAppButton
          phone={s.whatsapp}
          message={`Halo ${nama}, saya ingin bertanya tentang produk.`}
        />
      )}
    </>
  );
}
