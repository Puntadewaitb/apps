import { notFound } from "next/navigation";
import { isLang, type Lang } from "./i18n";

export type LangParams = { params: Promise<{ lang: string }> };

/** Ambil & validasi param `[lang]`; selain id/en → 404. */
export async function langDari(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}
