import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Accordion, Card, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../components/Ajakan";
import { getKonten, cariLayanan, semuaLayanan } from "../../../lib/konten";

// Hanya slug di content/layanan.id.ts yang valid; selain itu → 404 (tanpa render dinamis).
export const dynamicParams = false;

export function generateStaticParams() {
  return semuaLayanan().map((l) => ({ slug: l.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = cariLayanan((await params).slug);
  return l ? { title: l.nama, description: l.ringkas } : {};
}

export default async function LayananDetail({ params }: Props) {
  const l = cariLayanan((await params).slug);
  if (!l) notFound();
  const k = getKonten();
  const h = k.layananHalaman;
  const terkait = l.terkait.map((s) => cariLayanan(s)).filter((x) => x !== undefined);

  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/" className="underline underline-offset-2">
                  {h.breadcrumbBeranda}
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li>
                <a href="/layanan" className="underline underline-offset-2">
                  {h.judul}
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li aria-current="page" className="font-medium text-fg">
                {l.nama}
              </li>
            </ol>
          </nav>
          <span aria-hidden="true" className="text-4xl">
            {l.ikon}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-fg sm:text-4xl">{l.nama}</h1>
          <p className="mt-3 max-w-3xl text-lg text-muted">{l.ringkas}</p>
        </Container>
      </section>

      <Section id="deskripsi" title="">
        <div className="max-w-3xl space-y-4 text-fg">
          {l.deskripsi.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>

      <Section id="manfaat" tone="surface" title={h.manfaatJudul}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {l.manfaat.map((m) => (
            <li key={m} className="flex gap-3 rounded-lg border border-border bg-bg px-4 py-3">
              <span aria-hidden="true" className="text-success">
                ✓
              </span>
              <span className="text-fg">{m}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tahapan" title={h.tahapanJudul}>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {l.tahapan.map((t, i) => (
            <li key={t.judul}>
              <Card className="h-full" data-testid="tahap">
                <p className="text-sm font-semibold text-primary">Tahap {i + 1}</p>
                <h3 className="mt-1 font-semibold text-fg">{t.judul}</h3>
                <p className="mt-1 text-sm text-muted">{t.teks}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="hasil" tone="surface" title={h.hasilJudul}>
        <ul className="list-disc space-y-1 pl-5 text-fg">
          {l.hasil.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section id="faq" title={h.faqJudul}>
        <Accordion
          className="max-w-3xl"
          items={l.faq.map((f) => ({ id: f.id, title: f.q, content: f.a }))}
        />
      </Section>

      {terkait.length > 0 && (
        <Section id="terkait" tone="surface" title={h.terkaitJudul}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {terkait.map((t) => (
              <li key={t.slug}>
                <Card className="h-full">
                  <h3 className="font-semibold text-fg">
                    <span aria-hidden="true">{t.ikon} </span>
                    {t.nama}
                  </h3>
                  <p className="mt-1 text-muted">{t.ringkas}</p>
                  <a
                    href={`/layanan/${t.slug}`}
                    className="mt-3 inline-block font-medium text-primary underline underline-offset-2"
                  >
                    {h.cta} →
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Ajakan judul={h.ajakanJudul} teks={h.ajakanTeks} />
    </main>
  );
}
