import { notFound } from "next/navigation";
import { Container, Section } from "@tpl/ui";
import { Cover } from "../components/Cover";
import { getActiveEvent } from "../lib/event";
import { formatJam, formatTanggal } from "../lib/format";
import { guestNameFromParam } from "../lib/guest-name";

// Data acara dibaca dari DB saat request (berubah tanpa build ulang).
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const ev = await getActiveEvent();
  return ev ? { title: ev.title } : {};
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { to } = await searchParams;
  const ev = await getActiveEvent();
  if (!ev) notFound();

  const groom = ev.groomName.split(" ")[0] ?? ev.groomName;
  const bride = ev.brideName.split(" ")[0] ?? ev.brideName;

  return (
    <>
      <Cover
        guestName={guestNameFromParam(to)}
        groom={groom}
        bride={bride}
        dateText={formatTanggal(ev.akadAt)}
      />
      <main id="isi" tabIndex={-1} className="outline-none">
        <section className="bg-surface py-16 text-center sm:py-24">
          <Container>
            <p className="text-sm uppercase tracking-widest text-muted">Undangan Pernikahan</p>
            <h1 className="mt-4 font-serif text-4xl font-bold text-fg sm:text-6xl">
              {groom} <span className="text-primary">&amp;</span> {bride}
            </h1>
            <p className="mt-4 text-lg text-muted" data-testid="tanggal-akad">
              {formatTanggal(ev.akadAt)}
            </p>
          </Container>
        </section>
        <Section title="Waktu & Tempat">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-fg">Akad Nikah</dt>
              <dd className="text-muted">{formatJam(ev.akadAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Resepsi</dt>
              <dd className="text-muted">{formatJam(ev.resepsiAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-fg">{ev.venueName}</dt>
              <dd className="text-muted">{ev.venueAddress}</dd>
            </div>
          </dl>
        </Section>
      </main>
    </>
  );
}
