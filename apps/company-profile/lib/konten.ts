import { buildWhatsAppUrl } from "@tpl/ui";
import { blog as blogEn } from "../content/blog.en";
import { blog as blogId } from "../content/blog.id";
import { konten as kontenEn } from "../content/en";
import { konten as kontenId, type Konten } from "../content/id";
import { ui as uiEn } from "../content/ui.en";
import { ui as uiId } from "../content/ui.id";
import { localizeHref, type Lang } from "./i18n";

export type { Lang };

const SEMUA: Record<Lang, Konten> = { id: kontenId, en: kontenEn };
const UI: Record<Lang, typeof uiId> = { id: uiId, en: uiEn };
const BLOG: Record<Lang, typeof blogId> = { id: blogId, en: blogEn };

/** Konten bisnis untuk bahasa tertentu (struktur ID & EN dijamin identik oleh TypeScript). */
export function getKonten(lang: Lang = "id"): Konten {
  return SEMUA[lang];
}

/** Teks antarmuka untuk bahasa tertentu. */
export function getUi(lang: Lang = "id"): typeof uiId {
  return UI[lang];
}

/** Konfigurasi blog (judul, kategori) untuk bahasa tertentu. */
export function getBlog(lang: Lang = "id"): typeof blogId {
  return BLOG[lang];
}

/** Ganti placeholder "WHATSAPP" dengan tautan wa.me; path internal diberi awalan bahasa. */
export function resolveHref(href: string, k: Konten, lang: Lang = "id"): string {
  if (href === "WHATSAPP") return buildWhatsAppUrl(k.kontak.whatsapp, k.kontak.pesanWhatsapp);
  return localizeHref(lang, href);
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
