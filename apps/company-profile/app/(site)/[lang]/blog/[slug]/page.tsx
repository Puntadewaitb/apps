import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../../components/Ajakan";
import { ArtikelKartu } from "../../../../../components/ArtikelKartu";
import { Markdown } from "../../../../../components/Markdown";
import { cariArtikel, formatTanggalBlog, semuaArtikel } from "../../../../../lib/blog";
import { LANGS, localizeHref } from "../../../../../lib/i18n";
import { getBlog, getUi } from "../../../../../lib/konten";
import { langDari } from "../../../../../lib/page";
import { artikelLd, breadcrumbLd, jsonLd, pageMeta } from "../../../../../lib/seo";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => semuaArtikel(lang).map((a) => ({ lang, slug: a.slug })));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langDari(params);
  const a = cariArtikel((await params).slug, lang);
  if (!a) return {};
  return {
    ...pageMeta({
      lang,
      path: `/blog/${a.slug}`,
      title: a.judul,
      description: a.ringkas,
      type: "article",
      extra: { type: "article", publishedTime: a.tanggal, authors: [a.penulis] },
    }),
    authors: [{ name: a.penulis }],
  };
}

export default async function ArtikelPage({ params }: Props) {
  const lang = await langDari(params);
  const a = cariArtikel((await params).slug, lang);
  if (!a) notFound();
  const blog = getBlog(lang);
  const u = getUi(lang).blog;
  const kat = blog.kategori.find((k) => k.id === a.kategori);
  const terkait = semuaArtikel(lang)
    .filter((x) => x.kategori === a.kategori && x.slug !== a.slug)
    .slice(0, 2);
  const ld = [
    artikelLd(lang, a.slug),
    breadcrumbLd(lang, [
      { nama: blog.judul, path: "/blog" },
      { nama: kat?.nama ?? a.kategori, path: `/blog/kategori/${a.kategori}` },
      { nama: a.judul, path: `/blog/${a.slug}` },
    ]),
  ];

  return (
    <main id="isi">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <article>
        <header className="bg-surface py-12 sm:py-16">
          <Container>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
              <ol className="flex flex-wrap gap-2">
                <li>
                  <a href={localizeHref(lang, "/blog")} className="underline underline-offset-2">
                    {blog.judul}
                  </a>
                  <span aria-hidden="true"> /</span>
                </li>
                <li>
                  <a
                    href={localizeHref(lang, `/blog/kategori/${a.kategori}`)}
                    className="underline underline-offset-2"
                  >
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
              {a.penulis} · <time dateTime={a.tanggal}>{formatTanggalBlog(a.tanggal, lang)}</time> ·{" "}
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
        <Section id="terkait" tone="surface" title={u.terkait}>
          <ul className="grid gap-6 sm:grid-cols-2">
            {terkait.map((x) => (
              <li key={x.slug}>
                <ArtikelKartu a={x} lang={lang} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Ajakan lang={lang} />
    </main>
  );
}
