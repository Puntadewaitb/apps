import { Badge, ButtonLink, Container, Section } from "@tpl/ui";
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
      <Section id="kontak" title={k.ajakan.judul} subtitle={k.ajakan.teks}>
        <ul className="space-y-1 text-muted">
          <li>Telepon: {k.kontak.telepon}</li>
          <li>Email: {k.kontak.email}</li>
          <li>{k.kontak.alamat}</li>
          <li>{k.kontak.jamKerja}</li>
        </ul>
      </Section>
    </main>
  );
}
