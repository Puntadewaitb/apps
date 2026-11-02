import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../components/Ajakan";
import { ArtikelKartu } from "../../../../components/ArtikelKartu";
import { BlogFilter } from "../../../../components/BlogFilter";
import { blog } from "../../../../content/blog.id";
import { artikelPerKategori } from "../../../../lib/blog";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return blog.kategori.map((k) => ({ id: k.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const k = blog.kategori.find((x) => x.id === id);
  return k ? { title: `${k.nama} — ${blog.judul}`, description: k.deskripsi } : {};
}

export default async function KategoriBlog({ params }: Props) {
  const id = (await params).id;
  const kat = blog.kategori.find((x) => x.id === id);
  if (!kat) notFound();
  const daftar = artikelPerKategori(kat.id);
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <a href="/blog" className="underline underline-offset-2">
              {blog.judul}
            </a>
            <span aria-hidden="true"> / </span>
            <span aria-current="page" className="font-medium text-fg">
              {kat.nama}
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{kat.nama}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{kat.deskripsi}</p>
        </Container>
      </section>
      <Section id="artikel" title="">
        <BlogFilter aktif={kat.id} />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((a) => (
            <li key={a.slug}>
              <ArtikelKartu a={a} />
            </li>
          ))}
        </ul>
      </Section>
      <Ajakan />
    </main>
  );
}
