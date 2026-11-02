import type { Metadata } from "next";
import { Card, Container, Section } from "@tpl/ui";
import { Kalender } from "../../../components/Kalender";
import { parseBulan } from "../../../lib/agenda";
import { agendaBulan } from "../../../lib/agenda-db";
import { formatHariTanggal, formatJam, hariWib, formatTanggalPendek } from "../../../lib/format";

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description: "Kalender dan daftar kegiatan sekolah.",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ bulan?: string | string[] }> };

export default async function AgendaPage({ searchParams }: Props) {
  const sekarang = new Date();
  const pilih =
    parseBulan((await searchParams).bulan) ??
    (() => {
      const [t, b] = hariWib(sekarang).split("-");
      return { tahun: Number(t), bulan: Number(b) };
    })();
  const items = await agendaBulan(pilih.tahun, pilih.bulan);
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">Agenda Kegiatan</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">Kalender dan daftar kegiatan sekolah.</p>
        </Container>
      </section>
      <Section id="kalender" title="">
        <Kalender tahun={pilih.tahun} bulan={pilih.bulan} items={items} sekarang={sekarang} />
      </Section>
      <Section id="daftar-agenda" tone="surface" title="Daftar kegiatan bulan ini">
        {items.length === 0 ? (
          <p className="text-muted" data-testid="agenda-kosong">
            Tidak ada kegiatan pada bulan ini.
          </p>
        ) : (
          <ol className="space-y-4" data-testid="daftar-agenda">
            {items.map((a) => (
              <li key={a.id} id={`agenda-${a.id}`}>
                <Card data-testid="item-agenda">
                  <h3 className="text-lg font-semibold text-fg">{a.title}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">
                    <time dateTime={a.startsAt.toISOString()}>{formatHariTanggal(a.startsAt)}</time>
                    {a.endsAt && hariWib(a.endsAt) !== hariWib(a.startsAt) ? (
                      <>
                        {" "}
                        –{" "}
                        <time dateTime={a.endsAt.toISOString()}>
                          {formatTanggalPendek(a.endsAt)}
                        </time>
                      </>
                    ) : (
                      <>
                        {" "}
                        · {formatJam(a.startsAt)}
                        {a.endsAt ? `–${formatJam(a.endsAt)}` : ""} WIB
                      </>
                    )}
                  </p>
                  {a.location && <p className="text-sm text-muted">Lokasi: {a.location}</p>}
                  {a.description && <p className="mt-2 text-muted">{a.description}</p>}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </main>
  );
}
