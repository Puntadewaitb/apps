import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../components/Ajakan";
import { ProyekKartu } from "../../../components/ProyekKartu";
import { cariProyek, getKonten, semuaProyek } from "../../../lib/konten";

export const dynamicParams = false;

export function generateStaticParams() {
  return semuaProyek().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = cariProyek((await params).slug);
  return p ? { title: `${p.judul} — ${p.klien}`, description: p.ringkas } : {};
}

export default async function ProyekDetail({ params }: Props) {
  const p = cariProyek((await params).slug);
  if (!p) notFound();
  const k = getKonten();
  const kat = k.portofolio.kategori.find((c) => c.id === p.kategori);
  const layanan = k.layanan.find((l) => l.slug === kat?.layanan);
  const serupa = semuaProyek()
    .filter((x) => x.kategori === p.kategori && x.slug !== p.slug)
    .slice(0, 2);

  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/" className="underline underline-offset-2">
                  Beranda
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li>
                <a href="/portofolio" className="underline underline-offset-2">
                  {k.portofolio.judul}
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li aria-current="page" className="font-medium text-fg">
                {p.judul}
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary">{kat?.nama}</Badge>
            <span className="text-sm text-muted">{p.tahun}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">{p.judul}</h1>
          <p className="mt-2 text-lg text-muted" data-testid="klien">
            {p.klien}
          </p>
        </Container>
      </section>

      <Section id="ringkasan" title="">
        <div className="grid gap-8 md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.gambar}
            alt={`Ilustrasi proyek ${p.judul}`}
            width={400}
            height={300}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full rounded-xl border border-border"
          />
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-fg">Tantangan</h2>
              <p className="mt-2 text-muted">{p.tantangan}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-fg">Solusi</h2>
              <p className="mt-2 text-muted">{p.solusi}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="hasil" tone="surface" title="Hasil">
        <ul className="grid gap-3 sm:grid-cols-3">
          {p.hasil.map((h) => (
            <li key={h}>
              <Card className="h-full text-center">
                <p className="font-semibold text-fg">{h}</p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">Pendekatan: {p.teknologi.join(" · ")}</p>
        {layanan && (
          <p className="mt-2 text-sm">
            Layanan terkait:{" "}
            <a
              href={`/layanan/${layanan.slug}`}
              className="font-medium text-primary underline underline-offset-2"
            >
              {layanan.nama}
            </a>
          </p>
        )}
        <p className="mt-4 text-xs text-muted">{k.portofolio.catatan}</p>
      </Section>

      {serupa.length > 0 && (
        <Section id="serupa" title="Proyek serupa">
          <ul className="grid gap-6 sm:grid-cols-2">
            {serupa.map((x) => (
              <li key={x.slug}>
                <ProyekKartu p={x} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Ajakan />
    </main>
  );
}
