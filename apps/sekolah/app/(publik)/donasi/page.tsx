import type { Metadata } from "next";
import { Badge, ButtonLink, Card, Container, Section } from "@tpl/ui";
import { ProgresBar } from "../../../components/donasi/ProgresBar";
import { donasi } from "../../../content/donasi";
import { progresKosong, programAktif, progresSemua, terbukaUntukDonasi } from "../../../lib/donasi";
import { formatTanggal } from "../../../lib/format";

export const metadata: Metadata = { title: donasi.judul, description: donasi.pengantar };
export const dynamic = "force-dynamic";

export default async function DonasiPage() {
  const [programs, progres] = await Promise.all([programAktif(), progresSemua()]);
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{donasi.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{donasi.pengantar}</p>
        </Container>
      </section>

      <Section id="rekening" title="Rekening resmi">
        <ul className="grid gap-4 sm:grid-cols-2" data-testid="daftar-rekening">
          {donasi.rekening.map((r) => (
            <li key={r.nomor}>
              <Card>
                <p className="text-sm font-semibold text-primary">{r.bank}</p>
                <p className="mt-1 font-mono text-xl font-bold text-fg">{r.nomor}</p>
                <p className="text-sm text-muted">a.n. {r.atasNama}</p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{donasi.catatan}</p>
      </Section>

      <Section id="program" tone="surface" title="Program donasi">
        {programs.length === 0 ? (
          <p className="text-muted">Belum ada program donasi yang dibuka.</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const g = progres.get(p.id) ?? progresKosong();
              const buka = terbukaUntukDonasi(p);
              return (
                <li key={p.id}>
                  <Card
                    className="flex h-full flex-col overflow-hidden p-0"
                    data-testid="kartu-program-donasi"
                  >
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt=""
                        width={640}
                        height={360}
                        loading="lazy"
                        decoding="async"
                        className="h-auto w-full"
                      />
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h2 className="text-lg font-semibold text-fg">{p.title}</h2>
                      <p className="flex-1 text-muted">{p.description}</p>
                      <ProgresBar
                        terkumpul={g.terkumpul}
                        target={p.target}
                        persen={g.persen}
                        donatur={g.donatur}
                      />
                      <div className="flex items-center justify-between gap-2 text-xs text-muted">
                        {p.deadline ? (
                          <span>Sampai {formatTanggal(p.deadline)}</span>
                        ) : (
                          <span>Tanpa batas waktu</span>
                        )}
                        {!buka && <Badge>Ditutup</Badge>}
                      </div>
                      <ButtonLink
                        href={`/donasi/${p.slug}`}
                        aria-label={`Lihat program: ${p.title}`}
                        variant="secondary"
                      >
                        Lihat & donasi
                      </ButtonLink>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </main>
  );
}
