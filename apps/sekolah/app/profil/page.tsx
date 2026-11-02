import type { Metadata } from "next";
import { Card, Container, Section } from "@tpl/ui";
import { MapsEmbed } from "../../components/MapsEmbed";
import { Struktur } from "../../components/Struktur";
import { profil } from "../../content/profil";
import { sekolah } from "../../content/sekolah";

export const metadata: Metadata = { title: profil.judul, description: profil.pengantar };

export default function ProfilPage() {
  const s = profil.sambutan;
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{profil.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{profil.pengantar}</p>
        </Container>
      </section>

      <Section id="sambutan" title={s.judul}>
        <div className="grid items-start gap-8 md:grid-cols-[14rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.foto}
            alt={`Foto ${s.nama} (placeholder)`}
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            className="h-auto w-56 rounded-xl border border-border"
          />
          <div className="max-w-3xl space-y-4 text-fg">
            {s.paragraf.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="font-semibold">
              {s.nama}
              <span className="block text-sm font-normal text-muted">{s.jabatan}</span>
            </p>
          </div>
        </div>
      </Section>

      <Section id="visi-misi" tone="surface" title={profil.visiMisi.judul}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold text-fg">Visi</h3>
            <p className="mt-2 text-muted" data-testid="visi">
              {profil.visiMisi.visi}
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-bold text-fg">Misi</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted" data-testid="misi">
              {profil.visiMisi.misi.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </Card>
        </div>
      </Section>

      <Section id="sejarah" title={profil.sejarah.judul}>
        <ol className="relative max-w-3xl space-y-8 border-l-2 border-primary/30 pl-6">
          {profil.sejarah.peristiwa.map((p) => (
            <li key={p.tahun} data-testid="peristiwa" className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-bg"
              />
              <time className="text-sm font-semibold text-primary">{p.tahun}</time>
              <h3 className="mt-1 text-lg font-semibold text-fg">{p.judul}</h3>
              <p className="mt-1 text-muted">{p.teks}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="struktur" tone="surface" title={profil.struktur.judul}>
        <ul data-testid="struktur-organisasi" aria-label={profil.struktur.judul}>
          <Struktur node={profil.struktur.akar} />
        </ul>
      </Section>

      <Section id="lokasi" title={profil.lokasi.judul}>
        <div className="grid gap-6 md:grid-cols-2">
          <dl className="space-y-3 text-muted" data-testid="info-kontak">
            <div>
              <dt className="font-medium text-fg">Alamat</dt>
              <dd>{sekolah.kontak.alamat}</dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Telepon</dt>
              <dd>{sekolah.kontak.telepon}</dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Email</dt>
              <dd>
                <a
                  href={`mailto:${sekolah.kontak.email}`}
                  className="text-primary underline underline-offset-2"
                >
                  {sekolah.kontak.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Jam layanan</dt>
              <dd>{sekolah.kontak.jamLayanan}</dd>
            </div>
          </dl>
          <MapsEmbed
            embedUrl={profil.lokasi.mapsUrl}
            title={sekolah.nama}
            address={sekolah.kontak.alamat}
          />
        </div>
      </Section>
    </main>
  );
}
