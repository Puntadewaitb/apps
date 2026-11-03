import { ButtonLink, Container, Section } from "@tpl/ui";
import { KartuProduk } from "../../components/KartuProduk";
import { toko } from "../../content/toko";
import { produkTerbaru, semuaKategori, urlKatalog } from "../../lib/katalog";
import { getPengaturan } from "../../lib/setting";

export default async function HomePage() {
  const [produk, kategori, s] = await Promise.all([
    produkTerbaru(8),
    semuaKategori(),
    getPengaturan(),
  ]);
  return (
    <main id="isi">
      <section className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
              {s.nama}
            </h1>
            <p className="mt-4 text-lg text-muted">{s.tagline || toko.tagline}</p>
            <p className="mt-3 text-muted">{toko.deskripsi}</p>
            <ButtonLink href="/produk" size="lg" className="mt-8">
              Belanja sekarang
            </ButtonLink>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/hero.svg"
            alt="Ilustrasi toko (placeholder)"
            width={800}
            height={560}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full rounded-xl border border-border"
          />
        </Container>
      </section>
      <Section id="kategori" title="Belanja per kategori">
        <ul className="flex flex-wrap gap-3" data-testid="daftar-kategori">
          {kategori.map((k) => (
            <li key={k.id}>
              <a
                href={urlKatalog({ kategori: k.slug })}
                className="inline-flex rounded-full border border-border bg-bg px-4 py-2 text-sm font-medium text-fg hover:bg-surface"
              >
                {k.name}
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="produk-terbaru" title="Produk terbaru" tone="surface">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="daftar-produk">
          {produk.map((p, i) => (
            <li key={p.id}>
              <KartuProduk produk={p} prioritas={i < 4} />
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <a href="/produk" className="font-medium text-primary underline">
            Lihat semua produk →
          </a>
        </p>
      </Section>
    </main>
  );
}
