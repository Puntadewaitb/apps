import { LANGS, localizeHref } from "./i18n";
import { semuaRute } from "./seo";

let cache: Set<string> | undefined;

/** Semua path publik yang valid (kedua bahasa, berawalan sesuai URL sebenarnya). Dihitung sekali. */
export function ruteDikenal(): ReadonlySet<string> {
  if (!cache) {
    cache = new Set(
      LANGS.flatMap((lang) => semuaRute(lang).map((r) => localizeHref(lang, r.path))),
    );
  }
  return cache;
}

/** Hapus trailing slash (kecuali root). */
export const tanpaSlashAkhir = (p: string) =>
  p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
