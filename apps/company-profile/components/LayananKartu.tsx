import { Card } from "@tpl/ui";
import type { Layanan } from "../lib/konten";

export function LayananKartu({ l, cta }: { l: Layanan; cta: string }) {
  return (
    <Card className="flex h-full flex-col" data-testid="kartu-layanan">
      <span aria-hidden="true" className="text-3xl">
        {l.ikon}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-fg">{l.nama}</h3>
      <p className="mt-2 flex-1 text-muted">{l.ringkas}</p>
      <a
        href={`/layanan/${l.slug}`}
        aria-label={`${cta}: ${l.nama}`}
        className="mt-4 font-medium text-primary underline underline-offset-2"
      >
        {cta} →
      </a>
    </Card>
  );
}
