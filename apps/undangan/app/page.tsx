import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { Cover } from "../components/Cover";
import { Cerita } from "../components/Cerita";
import { DetailAcara } from "../components/DetailAcara";
import { Galeri } from "../components/Galeri";
import { Mempelai } from "../components/Mempelai";
import { VideoEmbed } from "../components/VideoEmbed";
import { getActiveEvent } from "../lib/event";
import { formatTanggal } from "../lib/format";
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
      </main>
    </>
  );
}
