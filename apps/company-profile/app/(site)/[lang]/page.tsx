import type { Metadata } from "next";
import { Badge, ButtonLink, Card, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../components/Ajakan";
import { Angka } from "../../../components/Angka";
import { KlienLogo } from "../../../components/KlienLogo";
import { LayananKartu } from "../../../components/LayananKartu";
import { ProyekKartu } from "../../../components/ProyekKartu";
import { TestimoniKlien } from "../../../components/TestimoniKlien";
import { localizeHref } from "../../../lib/i18n";
import { getKonten, getUi, resolveHref } from "../../../lib/konten";
import { langDari, type LangParams } from "../../../lib/page";
import { jsonLd, organizationLd, pageMeta, websiteLd } from "../../../lib/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  const k = getKonten(lang);
  const m = pageMeta({
    lang,
    path: "/",
    title: `${k.perusahaan.nama} — ${k.perusahaan.tagline}`,
    description: k.perusahaan.deskripsi,
  });
  // Judul beranda sudah memuat nama situs: pakai `absolute` agar template tidak menggandakannya.
  return { ...m, title: { absolute: `${k.perusahaan.nama} — ${k.perusahaan.tagline}` } };
}

export default async function HomePage({ params }: LangParams) {
  const lang = await langDari(params);
  const k = getKonten(lang);
  const u = getUi(lang);
  const { hero } = k;
  return (
    <main id="isi">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([organizationLd(lang), websiteLd(lang)]) }}
      />
      <section className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge tone="primary">{hero.eyebrow}</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
              {hero.judul}
            </h1>
            <p className="mt-4 text-lg text-muted">{hero.subjudul}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={resolveHref(hero.cta.href, k, lang)} size="lg">
                {hero.cta.label}
              </ButtonLink>
              <ButtonLink
                href={resolveHref(hero.ctaSekunder.href, k, lang)}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="secondary"
              >
                {hero.ctaSekunder.label}
              </ButtonLink>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.gambar.src}
            alt={hero.gambar.alt}
            width={640}
            height={480}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full rounded-xl border border-border"
          />
        </Container>
      </section>

      <Angka lang={lang} />

      <Section id="layanan" title={k.layananRingkas.judul} subtitle={k.layananRingkas.subjudul}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {k.layanan.map((l) => (
            <li key={l.slug}>
              <LayananKartu l={l} cta={k.layananHalaman.cta} lang={lang} />
            </li>
          ))}
        </ul>
        <ButtonLink
          href={resolveHref(k.layananRingkas.tautan.href, k, lang)}
          variant="secondary"
          className="mt-8"
        >
          {k.layananRingkas.tautan.label}
        </ButtonLink>
      </Section>

      <Section
        id="keunggulan"
        tone="surface"
        title={k.keunggulan.judul}
        subtitle={k.keunggulan.subjudul}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {k.keunggulan.butir.map((b) => (
            <li key={b.judul}>
              <Card className="h-full">
                <span aria-hidden="true" className="text-2xl">
                  {b.ikon}
                </span>
                <h3 className="mt-3 font-semibold text-fg">{b.judul}</h3>
                <p className="mt-1 text-muted">{b.teks}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="portofolio" title={u.beranda.proyekJudul} subtitle={u.beranda.proyekSubjudul}>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {k.portofolio.proyek.slice(0, 3).map((p) => (
            <li key={p.slug}>
              <ProyekKartu p={p} lang={lang} />
            </li>
          ))}
        </ul>
        <ButtonLink href={localizeHref(lang, "/portofolio")} variant="secondary" className="mt-8">
          {u.beranda.proyekTautan}
        </ButtonLink>
      </Section>

      <KlienLogo lang={lang} />
      <TestimoniKlien lang={lang} />

      <Section id="kontak" title={u.beranda.kontakJudul}>
        <ul className="space-y-1 text-muted">
          <li>
            {u.beranda.telepon}: {k.kontak.telepon}
          </li>
          <li>
            {u.beranda.email}: {k.kontak.email}
          </li>
          <li>{k.kontak.alamat}</li>
          <li>{k.kontak.jamKerja}</li>
        </ul>
      </Section>
      <Ajakan lang={lang} judul={k.ajakan.judul} teks={k.ajakan.teks} />
    </main>
  );
}
