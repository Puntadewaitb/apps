import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Lightbox, Section } from "@tpl/ui";
import { albumBySlug } from "../../../lib/galeri";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await albumBySlug((await params).slug);
  if (!a) return { title: "Album tidak ditemukan", robots: { index: false } };
  return { title: a.title, description: a.description || `Album foto: ${a.title}` };
}

export default async function AlbumPage({ params }: Props) {
  const a = await albumBySlug((await params).slug);
  if (!a) notFound();
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/galeri" className="underline underline-offset-2">
                  Galeri
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li aria-current="page" className="font-medium text-fg">
                {a.title}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{a.title}</h1>
          {a.description && <p className="mt-4 max-w-3xl text-lg text-muted">{a.description}</p>}
        </Container>
      </section>
      <Section id="foto" title="">
        {a.images.length === 0 ? (
          <p className="text-muted">Album ini belum berisi foto.</p>
        ) : (
          <Lightbox images={a.images.map((i) => ({ src: i.src, alt: i.caption || a.title }))} />
        )}
      </Section>
    </main>
  );
}
