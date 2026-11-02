import { Container } from "@tpl/ui";
import type { Event, Guest } from "../generated/prisma/client";
import { Amplop } from "./Amplop";
import { Cerita } from "./Cerita";
import { Cover } from "./Cover";
import { DetailAcara, type Sesi } from "./DetailAcara";
import { Galeri } from "./Galeri";
import { Mempelai, type Orang } from "./Mempelai";
import { NamaAcara } from "./NamaAcara";
import { RsvpSection } from "./RsvpForm";
import { Ucapan } from "./Ucapan";
import { VideoEmbed } from "./VideoEmbed";
import { formatTanggal } from "../lib/format";
import { DEFAULT_GUEST } from "../lib/guest-name";
import { JENIS, namaAcara, resolveJenis } from "../lib/jenis";
import { DEFAULT_MAX_PAX } from "../lib/schemas";
import { resolveTema } from "../lib/tema";
import { listVisibleWishes } from "../lib/wishes";

type Props = {
  ev: Event;
  /** Nama tamu dari ?to= (sudah disanitasi) atau nama dari data tamu */
  guestName: string;
  /** Tamu terdaftar (dari ?kode=) bila ada */
  tamu: Guest | null;
};

/** Seluruh halaman undangan untuk satu acara; tampilan mengikuti `ev.jenis` & `ev.tema`. */
export async function Undangan({ ev, guestName, tamu }: Props) {
  const jenis = resolveJenis(ev.jenis);
  const cfg = JENIS[jenis];
  const nama = namaAcara(jenis, ev);
  const namaIsian = tamu?.name ?? (guestName === DEFAULT_GUEST ? "" : guestName);
  const wishes = await listVisibleWishes(ev.id);

  const sesi: Sesi[] = cfg.sesi.map((s) =>
    s.key === "akad"
      ? {
          id: "akad",
          nama: s.nama,
          waktu: ev.akadAt,
          tempat: ev.venueName,
          alamat: ev.venueAddress,
        }
      : {
          id: "resepsi",
          nama: s.nama,
          waktu: ev.resepsiAt,
          tempat: ev.resepsiVenueName || ev.venueName,
          alamat: ev.resepsiVenueAddress || ev.venueAddress,
        },
  );

  const orang: Orang[] = cfg.duaOrang
    ? [
        {
          name: ev.groomName,
          parents: ev.groomParents,
          photo: "/img/mempelai-pria.svg",
          role: "mempelai pria",
        },
        {
          name: ev.brideName,
          parents: ev.brideParents,
          photo: "/img/mempelai-wanita.svg",
          role: "mempelai wanita",
        },
      ]
    : [
        {
          name: ev.groomName,
          parents: ev.groomParents,
          photo: "/img/anak.svg",
          role: jenis === "aqiqah" ? "si kecil" : "yang dikhitan",
        },
      ];

  return (
    <div
      data-theme={resolveTema(ev.tema)}
      data-jenis={jenis}
      className="min-h-screen bg-bg text-fg"
    >
      <Cover
        guestName={guestName}
        judul={cfg.judul}
        nama={nama}
        dateText={formatTanggal(ev.akadAt)}
      />
      <main id="isi" tabIndex={-1} className="outline-none">
        <section className="bg-surface py-16 text-center sm:py-24">
          <Container>
            <p className="text-sm uppercase tracking-widest text-muted">{cfg.judul}</p>
            <h1 className="mt-4 font-serif text-4xl font-bold text-fg sm:text-6xl">
              <NamaAcara nama={nama} />
            </h1>
            <p className="mt-4 text-lg text-muted" data-testid="tanggal-akad">
              {formatTanggal(ev.akadAt)}
            </p>
          </Container>
        </section>
        <Mempelai judul={cfg.profilJudul} quote={ev.quote} orang={orang} />
        <DetailAcara sesi={sesi} mapsUrl={ev.mapsUrl} countdownTarget={ev.akadAt.toISOString()} />
        {cfg.cerita && <Cerita />}
        <Galeri />
        <VideoEmbed />
        <Amplop />
        <RsvpSection
          defaultName={namaIsian}
          kode={tamu?.code}
          maxPax={tamu?.maxPax ?? DEFAULT_MAX_PAX}
        />
        <Ucapan initial={wishes.items} nextCursor={wishes.nextCursor} defaultName={namaIsian} />
      </main>
    </div>
  );
}
