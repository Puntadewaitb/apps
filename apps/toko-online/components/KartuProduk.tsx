import { Badge, Card } from "@tpl/ui";
import { hargaBervariasi, hargaMulai, habis, type ProdukLite } from "../lib/katalog";
import { rupiah } from "../lib/format";

type Props = {
  produk: ProdukLite & { slug: string; name: string; image: string; category: { name: string } };
  /** Gambar di atas lipatan dimuat segera; sisanya lazy. */
  prioritas?: boolean;
  /** Tingkat heading judul (jangan melompat: h2 di bawah h1, h3 di bawah h2 section). */
  level?: 2 | 3;
};

export function KartuProduk({ produk: p, prioritas, level = 3 }: Props) {
  const kosong = habis(p);
  const H = `h${level}` as const;
  return (
    <Card
      className="relative h-full overflow-hidden p-0 focus-within:ring-2 focus-within:ring-primary"
      data-testid="kartu-produk"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.image}
        alt=""
        width={600}
        height={600}
        loading={prioritas ? "eager" : "lazy"}
        decoding="async"
        className={kosong ? "h-auto w-full opacity-60 grayscale" : "h-auto w-full"}
      />
      <div className="p-4">
        <p className="text-xs text-muted">{p.category.name}</p>
        <H className="mt-1 font-semibold text-fg">
          {/* Seluruh kartu dapat diklik (::after menutupi kartu) tetapi hanya satu tautan untuk pembaca layar. */}
          <a href={`/produk/${p.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {p.name}
          </a>
        </H>
        <p className="mt-1 font-bold text-primary" data-testid="harga">
          {hargaBervariasi(p) && (
            <span className="text-xs font-normal text-muted">mulai dari </span>
          )}
          {rupiah(hargaMulai(p))}
        </p>
        {kosong && (
          <Badge className="mt-2" data-testid="badge-habis">
            Stok habis
          </Badge>
        )}
      </div>
    </Card>
  );
}
