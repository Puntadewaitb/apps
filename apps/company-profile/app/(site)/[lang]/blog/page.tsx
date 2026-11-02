import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../components/Ajakan";
import { ArtikelKartu } from "../../../../components/ArtikelKartu";
import { BlogFilter } from "../../../../components/BlogFilter";
import { semuaArtikel } from "../../../../lib/blog";
import { getBlog } from "../../../../lib/konten";
import { langDari, type LangParams } from "../../../../lib/page";
import { pageMeta } from "../../../../lib/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  const blog = getBlog(lang);
  return pageMeta({ lang, path: "/blog", title: blog.judul, description: blog.pengantar });
}

export default async function BlogPage({ params }: LangParams) {
  const lang = await langDari(params);
  const blog = getBlog(lang);
  const daftar = semuaArtikel(lang);
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{blog.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{blog.pengantar}</p>
        </Container>
      </section>
      <Section id="artikel" title="">
        <BlogFilter lang={lang} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((a) => (
            <li key={a.slug}>
              <ArtikelKartu a={a} lang={lang} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">{blog.catatan}</p>
      </Section>
      <Ajakan lang={lang} />
    </main>
  );
}
