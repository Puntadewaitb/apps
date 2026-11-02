/** Utilitas i18n: bahasa didukung, awalan URL, dan pengisian placeholder. */
export const LANGS = ["id", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "id";

export const isLang = (v: unknown): v is Lang =>
  typeof v === "string" && (LANGS as readonly string[]).includes(v);

/** Bahasa default tanpa awalan (`/layanan`); bahasa lain berawalan (`/en/layanan`). */
export function prefixFor(lang: Lang): string {
  return lang === DEFAULT_LANG ? "" : `/${lang}`;
}

/** Jadikan path internal sesuai bahasa. Anchor, https://, mailto:, dsb. dibiarkan. */
export function localizeHref(lang: Lang, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const p = prefixFor(lang);
  if (!p) return href;
  return href === "/" ? p : `${p}${href}`;
}

/** Path tanpa awalan bahasa (`/en/layanan` → `/layanan`). */
export function stripLang(pathname: string): string {
  for (const l of LANGS) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

/** Isi placeholder `{nama}` pada teks UI. */
export function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export const OG_LOCALE: Record<Lang, string> = { id: "id_ID", en: "en_US" };
export const HTML_LANG: Record<Lang, string> = { id: "id", en: "en" };
