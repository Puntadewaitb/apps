import type { Metadata } from "next";
import { ButtonLink, Card, Container, Section } from "@tpl/ui";
import { ppdb } from "../../../content/ppdb";

export const metadata: Metadata = {
  title: `${ppdb.judul} ${ppdb.tahunAjaran}`,
  description: ppdb.pengantar,
};

export default function PpdbPage() {
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <p className="text-sm font-semibold text-primary">Tahun ajaran {ppdb.tahunAjaran}</p>
          <h1 className="mt-1 text-3xl font-bold text-fg sm:text-4xl">{ppdb.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{ppdb.pengantar}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {ppdb.dibuka ? (
              <ButtonLink href="/ppdb/daftar" size="lg">
                Daftar Sekarang
              </ButtonLink>
            ) : (
              <p
                role="status"
                data-testid="ppdb-ditutup"
                className="rounded-md border border-border bg-bg px-4 py-3 text-fg"
              >
                Pendaftaran sedang ditutup.
              </p>
            )}
            <ButtonLink href="/ppdb/status" size="lg" variant="secondary">
              Cek Status Pendaftaran
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Section id="alur" title="Alur pendaftaran">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ppdb.alur.map((a, i) => (
            <li key={a}>
              <Card className="h-full">
                <p className="text-sm font-semibold text-primary">Langkah {i + 1}</p>
                <p className="mt-1 text-fg">{a}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="jadwal" tone="surface" title="Jadwal & jenjang">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold text-fg">Gelombang pendaftaran</h3>
            <ul className="mt-2 space-y-1 text-muted">
              {ppdb.gelombang.map((g) => (
                <li key={g.nama}>
                  <span className="font-medium text-fg">{g.nama}:</span> {g.periode}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-fg">Jenjang yang dibuka</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {ppdb.jenjang.map((j) => (
                <li key={j}>{j}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section id="dokumen" title="Dokumen yang perlu disiapkan">
        <ul className="list-disc space-y-1 pl-5 text-fg" data-testid="daftar-dokumen">
          {ppdb.dokumen.map((d) => (
            <li key={d.kind}>
              {d.label}
              {d.wajib ? "" : " (opsional)"}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Format PDF, PNG, JPG, atau WebP; maksimal 2 MB per berkas.
        </p>
      </Section>
    </main>
  );
}
