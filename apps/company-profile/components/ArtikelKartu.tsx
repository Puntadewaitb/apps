import { Badge, Card } from "@tpl/ui";
import { formatTanggalBlog, type Artikel } from "../lib/blog";
import { fmt, localizeHref } from "../lib/i18n";
import { getBlog, getUi, type Lang } from "../lib/konten";

type Props = { a: Artikel; lang: Lang; judulTag?: "h2" | "h3" };

export function ArtikelKartu({ a, lang, judulTag: H = "h3" }: Props) {
  const blog = getBlog(lang);
  const u = getUi(lang).blog;
  const kat = blog.kategori.find((k) => k.id === a.kategori);
  return (
    <Card
      className="flex h-full flex-col overflow-hidden p-0"
      data-testid="kartu-artikel"
      data-kategori={a.kategori}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a.gambar}
        alt=""
        width={400}
        height={300}
        loading="lazy"
        decoding="async"
        className="h-auto w-full"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <Badge tone="primary">{kat?.nama ?? a.kategori}</Badge>
          <time dateTime={a.tanggal} className="text-muted">
            {formatTanggalBlog(a.tanggal, lang)}
          </time>
        </div>
        <H className="mt-3 text-lg font-semibold text-fg">{a.judul}</H>
        <p className="mt-2 flex-1 text-muted">{a.ringkas}</p>
        <p className="mt-3 text-xs text-muted">
          {a.penulis} · {a.bacaMenit} {blog.bacaLabel}
        </p>
        <a
          href={localizeHref(lang, `/blog/${a.slug}`)}
          aria-label={fmt(u.bacaAria, { judul: a.judul })}
          className="mt-3 font-medium text-primary underline underline-offset-2"
        >
          {u.baca} →
        </a>
      </div>
    </Card>
  );
}
