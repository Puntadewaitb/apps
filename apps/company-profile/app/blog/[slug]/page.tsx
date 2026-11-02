import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../components/Ajakan";
import { ArtikelKartu } from "../../../components/ArtikelKartu";
import { Markdown } from "../../../components/Markdown";
import { blog } from "../../../content/blog.id";
import { cariArtikel, formatTanggalBlog, semuaArtikel } from "../../../lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return semuaArtikel().map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = cariArtikel((await params).slug);
  return a
    ? {
        title: a.judul,
        description: a.ringkas,
        authors: [{ name: a.penulis }],
        openGraph: {
          type: "article",
          publishedTime: a.tanggal,
          title: a.judul,
          description: a.ringkas,
        },
      }
    : {};
}

export default async function ArtikelPage({ params }: Props) {
  const a = cariArtikel((await params).slug);
  if (!a) notFound();
  const kat = blog.kategori.find((k) => k.id === a.kategori);
  const terkait = semuaArtikel()
    .filter((x) => x.kategori === a.kategori && x.slug !== a.slug)
    .slice(0, 2);

  return (
    <main id="isi">
      <article>
        <header className="bg-surface py-12 sm:py-16">
          <Container>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
              <ol className="flex flex-wrap gap-2">
                <li>
                  <a href="/blog" className="underline underline-offset-2">
                    {blog.judul}
                  </a>
                  <span aria-hidden="true"> /</span>
                </li>
                <li>
                  <a href={`/blog/kategori/${a.kategori}`} className="underline underline-offset-2">
                    {kat?.nama}
                  </a>
                  <span aria-hidden="true"> /</span>
                </li>
                <li aria-current="page" className="font-medium text-fg">
                  {a.judul}
                </li>
              </ol>
            </nav>
            <Badge tone="primary">{kat?.nama}</Badge>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold text-fg sm:text-4xl">{a.judul}</h1>
            <p className="mt-3 text-sm text-muted" data-testid="meta-artikel">
              {a.penulis} · <time dateTime={a.tanggal}>{formatTanggalBlog(a.tanggal)}</time> ·{" "}
              {a.bacaMenit} {blog.bacaLabel}
            </p>
          </Container>
        </header>
        <Container className="py-10">
          <Markdown source={a.isi} />
          <p className="mt-10 text-sm text-muted">{blog.catatan}</p>
        </Container>
      </article>

      {terkait.length > 0 && (
        <Section id="terkait" tone="surface" title="Artikel terkait">
          <ul className="grid gap-6 sm:grid-cols-2">
            {terkait.map((x) => (
              <li key={x.slug}>
                <ArtikelKartu a={x} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Ajakan />
    </main>
  );
}
