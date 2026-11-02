import { Badge, ButtonLink, Card, Container, Section } from "@tpl/ui";
import { Ajakan } from "../components/Ajakan";
import { LayananKartu } from "../components/LayananKartu";
import { getKonten, resolveHref } from "../lib/konten";

export default function HomePage() {
  const k = getKonten();
  const { hero } = k;
  return (
    <main id="isi">
      <section className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge tone="primary">{hero.eyebrow}</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
              {hero.judul}
            </h1>
            <p className="mt-4 text-lg text-muted">{hero.subjudul}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={resolveHref(hero.cta.href, k)} size="lg">
                {hero.cta.label}
              </ButtonLink>
              <ButtonLink
                href={resolveHref(hero.ctaSekunder.href, k)}
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

      <Section id="layanan" title={k.layananRingkas.judul} subtitle={k.layananRingkas.subjudul}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {k.layanan.map((l) => (
            <li key={l.slug}>
              <LayananKartu l={l} cta={k.layananHalaman.cta} />
            </li>
          ))}
        </ul>
        <ButtonLink href={k.layananRingkas.tautan.href} variant="secondary" className="mt-8">
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

      <Section id="kontak" title="Hubungi Kami">
        <ul className="space-y-1 text-muted">
          <li>Telepon: {k.kontak.telepon}</li>
          <li>Email: {k.kontak.email}</li>
          <li>{k.kontak.alamat}</li>
          <li>{k.kontak.jamKerja}</li>
        </ul>
      </Section>
      <Ajakan judul={k.ajakan.judul} teks={k.ajakan.teks} />
    </main>
  );
}
