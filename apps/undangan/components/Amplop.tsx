import { ButtonLink, Card, Section } from "@tpl/ui";
import { undangan } from "../content/undangan";
import { CopyButton } from "./CopyButton";

export function Amplop() {
  const { amplop } = undangan;
  return (
    <Section id="amplop" title={amplop.judul} subtitle={amplop.subjudul}>
      <div className="grid gap-4 md:grid-cols-2">
        {amplop.rekening.map((r) => (
          <Card key={r.id} data-testid={`rekening-${r.id}`}>
            <p className="text-sm text-muted">{r.jenis}</p>
            <h3 className="font-serif text-xl font-bold text-fg">{r.nama}</h3>
            <p className="mt-3 break-all font-mono text-2xl text-fg" data-testid="nomor">
              {r.nomor}
            </p>
            <p className="text-sm text-muted">a.n. {r.atasNama}</p>
            <CopyButton text={r.nomor} label={`Salin nomor ${r.nama}`} className="mt-4 block" />
          </Card>
        ))}

        <Card data-testid="qris" className="text-center">
          <h3 className="font-serif text-xl font-bold text-fg">QRIS</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={amplop.qris.src}
            alt={amplop.qris.alt}
            width={290}
            height={330}
            loading="lazy"
            decoding="async"
            className="mx-auto mt-3 h-auto w-full max-w-[260px] rounded-md border border-border bg-white"
          />
          <p className="mt-3 text-sm text-muted">{amplop.qris.catatan}</p>
          <ButtonLink
            href={amplop.qris.src}
            download="qris.svg"
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Unduh gambar
          </ButtonLink>
        </Card>

        <Card data-testid="hadiah">
          <h3 className="font-serif text-xl font-bold text-fg">{amplop.hadiah.judul}</h3>
          <p className="mt-3 font-medium text-fg">{amplop.hadiah.penerima}</p>
          <p className="text-muted" data-testid="alamat-hadiah">
            {amplop.hadiah.alamat}
          </p>
          <p className="mt-1 text-sm text-muted">Telepon: {amplop.hadiah.telepon}</p>
          <CopyButton
            text={`${amplop.hadiah.penerima}\n${amplop.hadiah.alamat}\nTelp. ${amplop.hadiah.telepon}`}
            label="Salin alamat pengiriman hadiah"
            className="mt-4 block"
          />
        </Card>
      </div>
    </Section>
  );
}
