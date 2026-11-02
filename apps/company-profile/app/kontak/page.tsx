import type { Metadata } from "next";
import { ButtonLink, Container, Section, buildWhatsAppUrl } from "@tpl/ui";
import { KontakForm } from "../../components/KontakForm";
import { MapsEmbed } from "../../components/MapsEmbed";
import { getKonten } from "../../lib/konten";

const k = getKonten();

export const metadata: Metadata = {
  title: "Kontak",
  description: `Hubungi ${k.perusahaan.nama}: telepon, email, WhatsApp, atau kirim pesan lewat formulir.`,
};

export default function KontakPage() {
  const c = k.kontak;
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">Hubungi Kami</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{k.ajakan.teks}</p>
        </Container>
      </section>

      <Section id="form-kontak" title="">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-fg">Kirim pesan</h2>
            <KontakForm layanan={k.layanan.map((l) => ({ slug: l.slug, nama: l.nama }))} />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-fg">Informasi kontak</h2>
              <dl className="mt-3 space-y-3 text-muted" data-testid="info-kontak">
                <div>
                  <dt className="font-medium text-fg">Telepon</dt>
                  <dd>{c.telepon}</dd>
                </div>
                <div>
                  <dt className="font-medium text-fg">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${c.email}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {c.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-fg">Alamat</dt>
                  <dd>{c.alamat}</dd>
                </div>
                <div>
                  <dt className="font-medium text-fg">Jam kerja</dt>
                  <dd>{c.jamKerja}</dd>
                </div>
              </dl>
              <ButtonLink
                href={buildWhatsAppUrl(c.whatsapp, c.pesanWhatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="mt-5"
              >
                Chat via WhatsApp
              </ButtonLink>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-fg">Lokasi</h2>
              <MapsEmbed embedUrl={c.mapsUrl} title={k.perusahaan.nama} address={c.alamat} />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
