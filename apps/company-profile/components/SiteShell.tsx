import type { ReactNode } from "react";
import { Footer, Navbar, WhatsAppButton } from "@tpl/ui";
import { fmt, localizeHref } from "../lib/i18n";
import { getKonten, getUi, type Lang } from "../lib/konten";
import { LangSwitcher } from "./LangSwitcher";

/** Navbar + Footer + tombol WhatsApp, dipakai layout situs publik dan layout admin. */
export function SiteShell({
  lang,
  children,
  switcher = true,
}: {
  lang: Lang;
  children: ReactNode;
  switcher?: boolean;
}) {
  const k = getKonten(lang);
  const u = getUi(lang);
  return (
    <>
      {/* Bypass block (WCAG 2.4.1): tampil hanya saat difokus dengan keyboard */}
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        {u.lewati}
      </a>
      <Navbar
        brand={k.perusahaan.nama}
        links={k.nav.map((l) => ({ ...l, href: localizeHref(lang, l.href) }))}
        cta={switcher ? <LangSwitcher lang={lang} labels={u.bahasa} /> : undefined}
        labels={{
          nav: u.navbar.navUtama,
          mobile: u.navbar.menuMobile,
          open: u.navbar.buka,
          close: u.navbar.tutup,
        }}
      />
      {children}
      <Footer
        brand={k.perusahaan.namaLengkap}
        description={k.footer.deskripsi}
        links={k.footer.tautan.map((l) => ({ ...l, href: localizeHref(lang, l.href) }))}
        navLabel={u.footer.navTautan}
        copyright={fmt(u.footer.hakCipta, {
          tahun: new Date().getFullYear(),
          nama: k.perusahaan.namaLengkap,
        })}
      />
      <WhatsAppButton
        phone={k.kontak.whatsapp}
        message={k.kontak.pesanWhatsapp}
        label={u.whatsapp.label}
      />
    </>
  );
}
