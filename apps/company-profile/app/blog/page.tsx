import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../components/Ajakan";
import { ArtikelKartu } from "../../components/ArtikelKartu";
import { BlogFilter } from "../../components/BlogFilter";
import { blog } from "../../content/blog.id";
import { semuaArtikel } from "../../lib/blog";

export const metadata: Metadata = { title: blog.judul, description: blog.pengantar };

export default function BlogPage() {
  const daftar = semuaArtikel();
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{blog.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{blog.pengantar}</p>
        </Container>
      </section>
      <Section id="artikel" title="">
        <BlogFilter />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((a) => (
            <li key={a.slug}>
              <ArtikelKartu a={a} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">{blog.catatan}</p>
      </Section>
      <Ajakan />
    </main>
  );
}
