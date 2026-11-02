import type { Metadata } from "next";
import { ButtonLink, Container, Section, buildWhatsAppUrl } from "@tpl/ui";
import { KontakForm } from "../../../../components/KontakForm";
import { MapsEmbed } from "../../../../components/MapsEmbed";
import { fmt } from "../../../../lib/i18n";
import { getKonten, getUi } from "../../../../lib/konten";
import { langDari, type LangParams } from "../../../../lib/page";
import { breadcrumbLd, jsonLd, organizationLd, pageMeta } from "../../../../lib/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  const k = getKonten(lang);
  const u = getUi(lang).kontak;
  return pageMeta({
    lang,
    path: "/kontak",
    title: u.metaJudul,
    description: fmt(u.metaDeskripsi, { nama: k.perusahaan.nama }),
  });
}

export default async function KontakPage({ params }: LangParams) {
  const lang = await langDari(params);
  const k = getKonten(lang);
  const ui = getUi(lang);
  const u = ui.kontak;
  const c = k.kontak;
  const ld = [
    organizationLd(lang),
    breadcrumbLd(lang, [
      { nama: ui.seo.beranda, path: "/" },
      { nama: u.metaJudul, path: "/kontak" },
    ]),
  ];
  return (
    <main id="isi">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{u.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{k.ajakan.teks}</p>
        </Container>
      </section>

      <Section id="form-kontak" title="">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-fg">{u.kirimPesan}</h2>
            <KontakForm
              lang={lang}
              t={ui.form}
              layanan={k.layanan.map((l) => ({ slug: l.slug, nama: l.nama }))}
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-fg">{u.info}</h2>
              <dl className="mt-3 space-y-3 text-muted" data-testid="info-kontak">
                <div>
                  <dt className="font-medium text-fg">{u.telepon}</dt>
                  <dd>{c.telepon}</dd>
                </div>
                <div>
                  <dt className="font-medium text-fg">{u.email}</dt>
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
                  <dt className="font-medium text-fg">{u.alamat}</dt>
                  <dd>{c.alamat}</dd>
                </div>
                <div>
                  <dt className="font-medium text-fg">{u.jamKerja}</dt>
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
                {u.whatsapp}
              </ButtonLink>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold text-fg">{u.lokasi}</h2>
              <MapsEmbed
                embedUrl={c.mapsUrl}
                title={k.perusahaan.nama}
                address={c.alamat}
                labels={ui.peta}
              />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
