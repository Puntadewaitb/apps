import { Badge, Card } from "@tpl/ui";
import { fmt, localizeHref } from "../lib/i18n";
import { getKonten, getUi, type Lang, type Proyek } from "../lib/konten";

export function ProyekKartu({ p, lang }: { p: Proyek; lang: Lang }) {
  const u = getUi(lang).proyek;
  const kat = getKonten(lang).portofolio.kategori.find((k) => k.id === p.kategori);
  return (
    <Card
      className="flex h-full flex-col overflow-hidden p-0"
      data-testid="kartu-proyek"
      data-kategori={p.kategori}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.gambar}
        alt={fmt(u.ilustrasi, { judul: p.judul })}
        width={400}
        height={300}
        loading="lazy"
        decoding="async"
        className="h-auto w-full"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="primary">{kat?.nama ?? p.kategori}</Badge>
          <span className="text-sm text-muted">{p.tahun}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-fg">{p.judul}</h3>
        <p className="text-sm text-muted">{p.klien}</p>
        <p className="mt-2 flex-1 text-muted">{p.ringkas}</p>
        <a
          href={localizeHref(lang, `/portofolio/${p.slug}`)}
          aria-label={fmt(u.lihatAria, { judul: p.judul })}
          className="mt-4 font-medium text-primary underline underline-offset-2"
        >
          {u.lihat} →
        </a>
      </div>
    </Card>
  );
}
