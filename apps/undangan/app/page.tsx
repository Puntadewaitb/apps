import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { Cover } from "../components/Cover";
import { Cerita } from "../components/Cerita";
import { DetailAcara } from "../components/DetailAcara";
import { Galeri } from "../components/Galeri";
import { Mempelai } from "../components/Mempelai";
import { RsvpSection } from "../components/RsvpForm";
import { Ucapan } from "../components/Ucapan";
import { VideoEmbed } from "../components/VideoEmbed";
import { getActiveEvent } from "../lib/event";
import { formatTanggal } from "../lib/format";
import { db } from "../lib/db";
import { DEFAULT_GUEST, guestNameFromParam } from "../lib/guest-name";
import { DEFAULT_MAX_PAX, KODE_RE } from "../lib/schemas";
import { listVisibleWishes } from "../lib/wishes";

// Data acara dibaca dari DB saat request (berubah tanpa build ulang).
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const ev = await getActiveEvent();
  return ev ? { title: ev.title } : {};
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string | string[]; kode?: string | string[] }>;
}) {
  const { to, kode: kodeParam } = await searchParams;
  const ev = await getActiveEvent();
  if (!ev) notFound();

  // Tautan pribadi: ?kode=DEMO-0001 → nama & batas jumlah orang dari data tamu.
  const kodeRaw = Array.isArray(kodeParam) ? kodeParam[0] : kodeParam;
  const guest =
    kodeRaw && KODE_RE.test(kodeRaw)
      ? await db().guest.findUnique({ where: { code: kodeRaw.toUpperCase() } })
      : null;
  const tamu = guest && guest.eventId === ev.id ? guest : null;
  const guestName = tamu?.name ?? guestNameFromParam(to);
  const namaIsian = tamu?.name ?? (guestName === DEFAULT_GUEST ? "" : guestName);
  const wishes = await listVisibleWishes(ev.id);

  const groom = ev.groomName.split(" ")[0] ?? ev.groomName;
  const bride = ev.brideName.split(" ")[0] ?? ev.brideName;

  return (
    <>
      <Cover
        guestName={guestName}
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
        <Mempelai
          quote={ev.quote}
          groom={{
            name: ev.groomName,
            parents: ev.groomParents,
            photo: "/img/mempelai-pria.svg",
            role: "mempelai pria",
          }}
          bride={{
            name: ev.brideName,
            parents: ev.brideParents,
            photo: "/img/mempelai-wanita.svg",
            role: "mempelai wanita",
          }}
        />
        <DetailAcara
          countdownTarget={ev.akadAt.toISOString()}
          mapsUrl={ev.mapsUrl}
          akad={{
            id: "akad",
            nama: "Akad Nikah",
            waktu: ev.akadAt,
            tempat: ev.venueName,
            alamat: ev.venueAddress,
          }}
          resepsi={{
            id: "resepsi",
            nama: "Resepsi",
            waktu: ev.resepsiAt,
            tempat: ev.resepsiVenueName || ev.venueName,
            alamat: ev.resepsiVenueAddress || ev.venueAddress,
          }}
        />
        <Cerita />
        <Galeri />
        <VideoEmbed />
        <RsvpSection
          defaultName={namaIsian}
          kode={tamu?.code}
          maxPax={tamu?.maxPax ?? DEFAULT_MAX_PAX}
        />
        <Ucapan initial={wishes.items} nextCursor={wishes.nextCursor} defaultName={namaIsian} />
      </main>
    </>
  );
}
