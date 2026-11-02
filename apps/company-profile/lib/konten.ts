import { buildWhatsAppUrl } from "@tpl/ui";
import { konten, type Konten } from "../content/id";

export type Lang = "id";

/** Konten untuk bahasa tertentu. (English ditambahkan di langkah C5.) */
const SEMUA: Record<Lang, Konten> = { id: konten };

export function getKonten(lang: Lang = "id"): Konten {
  return SEMUA[lang];
}

/** Ganti placeholder "WHATSAPP" pada href dengan tautan wa.me berisi pesan awal. */
export function resolveHref(href: string, k: Konten): string {
  return href === "WHATSAPP" ? buildWhatsAppUrl(k.kontak.whatsapp, k.kontak.pesanWhatsapp) : href;
}

export type Layanan = Konten["layanan"][number];

export function semuaLayanan(lang: Lang = "id"): Layanan[] {
  return getKonten(lang).layanan;
}

export function cariLayanan(slug: string, lang: Lang = "id"): Layanan | undefined {
  return semuaLayanan(lang).find((l) => l.slug === slug);
}

export type Proyek = Konten["portofolio"]["proyek"][number];
export type KategoriProyek = Konten["portofolio"]["kategori"][number];

export function semuaProyek(lang: Lang = "id"): Proyek[] {
  return getKonten(lang).portofolio.proyek;
}

export function cariProyek(slug: string, lang: Lang = "id"): Proyek | undefined {
  return semuaProyek(lang).find((p) => p.slug === slug);
}

/** ID kategori valid dari query string; nilai tak dikenal/ganda → undefined (tampilkan semua). */
export function kategoriValid(
  param: string | string[] | undefined,
  lang: Lang = "id",
): string | undefined {
  const v = Array.isArray(param) ? param[0] : param;
  return getKonten(lang).portofolio.kategori.find((k) => k.id === v)?.id;
}

export function proyekPerKategori(kategori: string | undefined, lang: Lang = "id"): Proyek[] {
  return kategori ? semuaProyek(lang).filter((p) => p.kategori === kategori) : semuaProyek(lang);
}
