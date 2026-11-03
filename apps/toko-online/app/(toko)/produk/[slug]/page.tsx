import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { GaleriProduk } from "../../../../components/GaleriProduk";
import { KartuProduk } from "../../../../components/KartuProduk";
import { PilihVarian } from "../../../../components/PilihVarian";
import { siteUrl } from "../../../../lib/env";
import { hargaVarian } from "../../../../lib/format";
import {
  galeriProduk,
  hargaMulai,
  jsonLd,
  produkBySlug,
  produkTerkait,
  stokTotal,
  urlKatalog,
} from "../../../../lib/katalog";
import { getPengaturan } from "../../../../lib/setting";

type Props = { params: Promise<{ slug: string }> };

const ringkas = (t: string, n = 160) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await produkBySlug((await params).slug);
  if (!p) return { title: "Produk tidak ditemukan", robots: { index: false } };
  return {
    title: p.name,
    description: ringkas(p.description),
    alternates: { canonical: `/produk/${p.slug}` },
    openGraph: {
      title: p.name,
      description: ringkas(p.description),
      images: [p.image],
      type: "website",
    },
  };
}

export default async function DetailProduk({ params }: Props) {
  const p = await produkBySlug((await params).slug);
  if (!p) notFound();
  const [terkait, s] = await Promise.all([produkTerkait(p.categoryId, p.id), getPengaturan()]);
  const gambar = galeriProduk(p.image, p.images);
  const varian = p.variants.map((v) => ({
    id: v.id,
    name: v.name,
    harga: hargaVarian(p, v),
    stock: v.stock,
  }));
  const tersedia = stokTotal({ price: p.price, variants: p.variants }) > 0;
  const base = siteUrl();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: gambar.map((g) => `${base}${g}`),
    category: p.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: hargaMulai({ price: p.price, variants: p.variants }),
      availability: tersedia ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${base}/produk/${p.slug}`,
      seller: { "@type": "Organization", name: s.nama },
    },
  };
  return (
    <main id="isi" className="py-10">
      <Container>
        <nav aria-label="Jejak halaman" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <a href="/" className="hover:text-fg">
                Beranda
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href="/produk" className="hover:text-fg">
                Produk
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href={urlKatalog({ kategori: p.category.slug })} className="hover:text-fg">
                {p.category.name}
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">
              {p.name}
            </li>
          </ol>
        </nav>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <GaleriProduk gambar={gambar} nama={p.name} />
          <div>
            <p className="text-sm text-muted">{p.category.name}</p>
            <h1 className="mt-1 text-3xl font-bold text-fg">{p.name}</h1>
            <div className="mt-5">
              <PilihVarian varian={varian} hargaDasar={p.price} nama={p.name} />
            </div>
            <h2 className="mt-8 text-lg font-semibold text-fg">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line text-muted" data-testid="deskripsi">
              {p.description}
            </p>
          </div>
        </div>
        {terkait.length > 0 && (
          <section aria-labelledby="terkait" className="mt-16">
            <h2 id="terkait" className="text-2xl font-bold text-fg">
              Produk terkait
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {terkait.map((t) => (
                <li key={t.id}>
                  <KartuProduk produk={t} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      </Container>
    </main>
  );
}
