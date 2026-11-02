import type { Metadata } from "next";
import { Card, Container, Section } from "@tpl/ui";
import { daftarAlbum } from "../../lib/galeri";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Dokumentasi kegiatan sekolah dalam album foto.",
};
export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const albums = await daftarAlbum();
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">Galeri</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Dokumentasi kegiatan sekolah dalam album foto.
          </p>
        </Container>
      </section>
      <Section id="album" title="">
        {albums.length === 0 ? (
          <p className="text-muted">Belum ada album.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <li key={a.slug}>
                <Card
                  className="flex h-full flex-col overflow-hidden p-0"
                  data-testid="kartu-album"
                >
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover}
                      alt=""
                      width={640}
                      height={480}
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-semibold text-fg">{a.title}</h2>
                    <p className="mt-1 flex-1 text-muted">{a.description}</p>
                    <p className="mt-2 text-xs text-muted">{a._count.images} foto</p>
                    <a
                      href={`/galeri/${a.slug}`}
                      aria-label={`Buka album: ${a.title}`}
                      className="mt-3 font-medium text-primary underline underline-offset-2"
                    >
                      Buka album →
                    </a>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
