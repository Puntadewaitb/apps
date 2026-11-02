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
