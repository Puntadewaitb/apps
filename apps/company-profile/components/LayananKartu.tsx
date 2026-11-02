import { Card } from "@tpl/ui";
import { localizeHref } from "../lib/i18n";
import type { Lang, Layanan } from "../lib/konten";

type Props = {
  l: Layanan;
  cta: string;
  lang: Lang;
  /** Level heading judul kartu: h3 bila ada h2 di atasnya (default), h2 di halaman daftar tanpa h2. */
  judulTag?: "h2" | "h3";
};

export function LayananKartu({ l, cta, lang, judulTag: H = "h3" }: Props) {
  return (
    <Card className="flex h-full flex-col" data-testid="kartu-layanan">
      <span aria-hidden="true" className="text-3xl">
        {l.ikon}
      </span>
      <H className="mt-3 text-lg font-semibold text-fg">{l.nama}</H>
      <p className="mt-2 flex-1 text-muted">{l.ringkas}</p>
      <a
        href={localizeHref(lang, `/layanan/${l.slug}`)}
        aria-label={`${cta}: ${l.nama}`}
        className="mt-4 font-medium text-primary underline underline-offset-2"
      >
        {cta} →
      </a>
    </Card>
  );
}
