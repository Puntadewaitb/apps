import type { Metadata } from "next";
import { Card, Container, Section } from "@tpl/ui";
import { guruAktif } from "../../../lib/teachers";

export const metadata: Metadata = {
  title: "Guru & Staf",
  description: "Para pendidik dan tenaga kependidikan Sekolah Cendekia Nusantara.",
};
// Data dari database (dikelola admin di S5) → dirender per-request.
export const dynamic = "force-dynamic";

export default async function GuruPage() {
  const daftar = await guruAktif();
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">Guru & Staf</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Para pendidik dan tenaga kependidikan yang mendampingi siswa setiap hari.
          </p>
        </Container>
      </section>
      <Section id="daftar-guru" title="">
        {daftar.length === 0 ? (
          <p className="text-muted">Data guru belum tersedia.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((g) => (
              <li key={g.id}>
                <Card className="h-full text-center" data-testid="kartu-guru">
                  {g.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.photo}
                      alt={`Foto ${g.name}${g.photo.startsWith("/img/") ? " (placeholder)" : ""}`}
                      width={160}
                      height={160}
                      loading="lazy"
                      decoding="async"
                      className="mx-auto h-32 w-32 rounded-full border-4 border-bg object-cover"
                    />
                  )}
                  <h2 className="mt-4 text-lg font-semibold text-fg">{g.name}</h2>
                  <p className="text-sm font-medium text-primary">{g.position}</p>
                  {g.subject && <p className="text-sm text-muted">{g.subject}</p>}
                  {g.bio && <p className="mt-2 text-sm text-muted">{g.bio}</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
