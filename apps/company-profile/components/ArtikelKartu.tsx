import { Badge, Card } from "@tpl/ui";
import { blog } from "../content/blog.id";
import { formatTanggalBlog, type Artikel } from "../lib/blog";

export function ArtikelKartu({ a }: { a: Artikel }) {
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
            {formatTanggalBlog(a.tanggal)}
          </time>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-fg">{a.judul}</h3>
        <p className="mt-2 flex-1 text-muted">{a.ringkas}</p>
        <p className="mt-3 text-xs text-muted">
          {a.penulis} · {a.bacaMenit} {blog.bacaLabel}
        </p>
        <a
          href={`/blog/${a.slug}`}
          aria-label={`Baca artikel: ${a.judul}`}
          className="mt-3 font-medium text-primary underline underline-offset-2"
        >
          Baca selengkapnya →
        </a>
      </div>
    </Card>
  );
}
