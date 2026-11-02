import { ButtonLink, Card, Section } from "@tpl/ui";
import { Countdown } from "./Countdown";
import { MapsEmbed } from "./MapsEmbed";
import { formatJam, formatTanggal } from "../lib/format";

export type Sesi = { id: string; nama: string; waktu: Date; tempat: string; alamat: string };

type Props = {
  /** 1 atau 2 sesi (mis. akad + resepsi, atau satu acara saja) */
  sesi: Sesi[];
  mapsUrl: string;
  /** ISO 8601 target hitung mundur (awal sesi pertama) */
  countdownTarget: string;
  /** Tampilkan tombol simpan ke kalender (.ics acara aktif) */
  kalender?: boolean;
};

export function DetailAcara({ sesi, mapsUrl, countdownTarget, kalender = true }: Props) {
  const [pertama, kedua] = sesi;
  const samaTempat =
    !kedua || (pertama!.tempat === kedua.tempat && pertama!.alamat === kedua.alamat);
  return (
    <Section id="acara" title="Detail Acara">
      <div className="mb-10">
        <Countdown target={countdownTarget} />
      </div>

      <div className={`grid gap-4 ${sesi.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
        {sesi.map((s) => (
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
            {samaTempat ? "Lokasi Acara" : `Lokasi ${pertama!.nama}`}
          </h3>
          <MapsEmbed embedUrl={mapsUrl} title={pertama!.tempat} address={pertama!.alamat} />
        </div>
        {!samaTempat && kedua && (
          <div>
            <h3 className="mb-3 font-semibold text-fg">Lokasi {kedua.nama}</h3>
            <MapsEmbed embedUrl="" title={kedua.tempat} address={kedua.alamat} />
          </div>
        )}
      </div>

      {kalender && (
        <div className="mt-8">
          <ButtonLink href="/api/kalender" download="undangan.ics" variant="secondary">
            Simpan ke Kalender (.ics)
          </ButtonLink>
        </div>
      )}
    </Section>
  );
}
