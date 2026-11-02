import { Badge, Card } from "@tpl/ui";
import { formatTanggal } from "../lib/format";

type Props = {
  p: {
    slug: string;
    kind: string;
    title: string;
    excerpt: string;
    image: string;
    publishedAt: Date | null;
  };
  /** Level heading judul: h2 di halaman daftar (tanpa h2 di atasnya), h3 bila ada h2 di atasnya. */
  judulTag?: "h2" | "h3";
};

export function PostKartu({ p, judulTag: H = "h3" }: Props) {
  return (
    <Card
      className="flex h-full flex-col overflow-hidden p-0"
      data-testid="kartu-berita"
      data-kind={p.kind}
    >
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          className="h-auto w-full"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <Badge tone={p.kind === "PENGUMUMAN" ? "primary" : "neutral"}>
            {p.kind === "PENGUMUMAN" ? "Pengumuman" : "Berita"}
          </Badge>
          {p.publishedAt && (
            <time dateTime={p.publishedAt.toISOString()} className="text-muted">
              {formatTanggal(p.publishedAt)}
            </time>
          )}
        </div>
        <H className="mt-3 text-lg font-semibold text-fg">{p.title}</H>
        <p className="mt-2 flex-1 text-muted">{p.excerpt}</p>
        <a
          href={`/berita/${p.slug}`}
          aria-label={`Baca selengkapnya: ${p.title}`}
          className="mt-3 font-medium text-primary underline underline-offset-2"
        >
          Baca selengkapnya →
        </a>
      </div>
    </Card>
  );
}
