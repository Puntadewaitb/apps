import { Badge, Card, Container, Section } from "@tpl/ui";
import { toko } from "../content/toko";
import { rupiah } from "../lib/format";
import { produkTerbaru } from "../lib/produk";

// Data dari database → dirender per-request (katalog lengkap dibangun di T2).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const produk = await produkTerbaru(8);
  return (
    <main id="isi">
      <section className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
              {toko.nama}
            </h1>
            <p className="mt-4 text-lg text-muted">{toko.tagline}</p>
            <p className="mt-3 text-muted">{toko.deskripsi}</p>
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
      <Section id="produk-terbaru" title="Produk terbaru">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="daftar-produk">
          {produk.map((p) => {
            const habis = p.variants.every((v) => v.stock <= 0);
            return (
              <li key={p.id}>
                <Card className="h-full overflow-hidden p-0" data-testid="kartu-produk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full"
                  />
                  <div className="p-4">
                    <p className="text-xs text-muted">{p.category.name}</p>
                    <h2 className="mt-1 font-semibold text-fg">{p.name}</h2>
                    <p className="mt-1 font-bold text-primary">{rupiah(p.price)}</p>
                    {habis && <Badge>Stok habis</Badge>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>
    </main>
  );
}
