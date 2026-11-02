import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container, Section } from "@tpl/ui";
import { Markdown } from "../../../../components/Markdown";
import { PostKartu } from "../../../../components/PostKartu";
import { beritaBySlug, beritaTerkait } from "../../../../lib/berita";
import { formatTanggal } from "../../../../lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await beritaBySlug((await params).slug);
  if (!p) return { title: "Tulisan tidak ditemukan", robots: { index: false } };
  return {
    title: p.title,
    description: p.excerpt,
    openGraph: {
      type: "article",
      title: p.title,
      description: p.excerpt,
      ...(p.publishedAt ? { publishedTime: p.publishedAt.toISOString() } : {}),
    },
  };
}

export default async function BeritaDetail({ params }: Props) {
  const p = await beritaBySlug((await params).slug);
  if (!p) notFound();
  const terkait = await beritaTerkait(p.slug, p.kind);
  const label = p.kind === "PENGUMUMAN" ? "Pengumuman" : "Berita";
  return (
    <main id="isi">
      <article>
        <header className="bg-surface py-12 sm:py-16">
          <Container>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
              <ol className="flex flex-wrap gap-2">
                <li>
                  <a href="/berita" className="underline underline-offset-2">
                    Berita & Pengumuman
                  </a>
                  <span aria-hidden="true"> /</span>
                </li>
                <li aria-current="page" className="font-medium text-fg">
                  {p.title}
                </li>
              </ol>
            </nav>
            <Badge tone={p.kind === "PENGUMUMAN" ? "primary" : "neutral"}>{label}</Badge>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold text-fg sm:text-4xl">{p.title}</h1>
            <p className="mt-3 text-sm text-muted" data-testid="meta-berita">
              {p.author?.name ? `${p.author.name} · ` : ""}
              {p.publishedAt && (
                <time dateTime={p.publishedAt.toISOString()}>{formatTanggal(p.publishedAt)}</time>
              )}
            </p>
          </Container>
        </header>
        <Container className="py-10">
          {p.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt=""
              width={640}
              height={360}
              fetchPriority="high"
              decoding="async"
              className="mb-8 h-auto w-full max-w-3xl rounded-xl border border-border"
            />
          )}
          <Markdown source={p.body} />
        </Container>
      </article>
      {terkait.length > 0 && (
        <Section id="terkait" tone="surface" title={`${label} lainnya`}>
          <ul className="grid gap-6 sm:grid-cols-2">
            {terkait.map((x) => (
              <li key={x.id}>
                <PostKartu p={x} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}
