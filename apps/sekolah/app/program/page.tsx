import type { Metadata } from "next";
import { Badge, Card, Container, Section } from "@tpl/ui";
import { program } from "../../content/program";

export const metadata: Metadata = { title: program.judul, description: program.pengantar };

export default function ProgramPage() {
  const ek = program.ekstrakurikuler;
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{program.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{program.pengantar}</p>
        </Container>
      </section>

      <Section id="akademik" title={program.akademik.judul}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {program.akademik.daftar.map((p) => (
            <li key={p.id}>
              <Card className="h-full" data-testid="program-akademik">
                <span aria-hidden="true" className="text-3xl">
                  {p.ikon}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-fg">{p.nama}</h3>
                <p className="mt-1 text-muted">{p.ringkas}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg">
                  {p.butir.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ekstrakurikuler" tone="surface" title={ek.judul} subtitle={ek.subjudul}>
        <div className="space-y-8">
          {ek.kategori.map((k) => (
            <div key={k.id} data-testid="kategori-ekskul" data-kategori={k.id}>
              <h3 className="mb-3 text-xl font-semibold text-fg">{k.nama}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ek.daftar
                  .filter((e) => e.kategori === k.id)
                  .map((e) => (
                    <li key={e.id}>
                      <Card className="h-full" data-testid="kartu-ekskul">
                        <Badge tone="primary">{k.nama}</Badge>
                        <h4 className="mt-2 font-semibold text-fg">{e.nama}</h4>
                        <p className="mt-1 text-sm text-muted">Jadwal: {e.jadwal}</p>
                        <p className="text-sm text-muted">Pembina: {e.pembina}</p>
                      </Card>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
