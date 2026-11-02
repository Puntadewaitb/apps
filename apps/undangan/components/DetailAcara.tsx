import { ButtonLink, Card, Section } from "@tpl/ui";
import { Countdown } from "./Countdown";
import { MapsEmbed } from "./MapsEmbed";
import { formatJam, formatTanggal } from "../lib/format";

type Sesi = { id: string; nama: string; waktu: Date; tempat: string; alamat: string };

type Props = {
  akad: Sesi;
  resepsi: Sesi;
  mapsUrl: string;
  /** ISO 8601 target hitung mundur (awal akad) */
  countdownTarget: string;
};

export function DetailAcara({ akad, resepsi, mapsUrl, countdownTarget }: Props) {
  const samaTempat = akad.tempat === resepsi.tempat && akad.alamat === resepsi.alamat;
  return (
    <Section id="acara" title="Detail Acara">
      <div className="mb-10">
        <Countdown target={countdownTarget} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[akad, resepsi].map((s) => (
          <Card key={s.id} data-testid={`sesi-${s.id}`}>
            <h3 className="font-serif text-xl font-bold text-fg">{s.nama}</h3>
            <p className="mt-2 font-medium text-fg">{formatTanggal(s.waktu)}</p>
            <p className="text-muted">{formatJam(s.waktu)}</p>
            <p className="mt-3 font-medium text-fg">{s.tempat}</p>
            <p className="text-sm text-muted">{s.alamat}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold text-fg">
            {samaTempat ? "Lokasi Acara" : `Lokasi ${akad.nama}`}
          </h3>
          <MapsEmbed embedUrl={mapsUrl} title={akad.tempat} address={akad.alamat} />
        </div>
        {!samaTempat && (
          <div>
            <h3 className="mb-3 font-semibold text-fg">Lokasi {resepsi.nama}</h3>
            <MapsEmbed embedUrl="" title={resepsi.tempat} address={resepsi.alamat} />
          </div>
        )}
      </div>

      <div className="mt-8">
        <ButtonLink href="/api/kalender" download="undangan.ics" variant="secondary">
          Simpan ke Kalender (.ics)
        </ButtonLink>
      </div>
    </Section>
  );
}
