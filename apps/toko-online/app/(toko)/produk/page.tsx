import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FilterProduk } from "../../../components/FilterProduk";
import { KartuProduk } from "../../../components/KartuProduk";
import { Paginasi } from "../../../components/Paginasi";
import {
  cariProduk,
  parseHalaman,
  parseQ,
  parseSlug,
  parseUrut,
  semuaKategori,
  urlKatalog,
} from "../../../lib/katalog";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const q = parseQ(sp.q);
  const halaman = parseHalaman(sp.halaman);
  // Hasil pencarian/halaman turunan tidak diindeks; kanonik = daftar utama per kategori.
  return {
    title: "Semua Produk",
    description:
      "Telusuri produk pilihan: filter kategori, cari nama produk, dan urutkan berdasarkan harga.",
    alternates: { canonical: urlKatalog({ kategori: parseSlug(sp.kategori) }) },
    robots: q || halaman > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function KatalogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kategoriList = await semuaKategori();
  const slug = parseSlug(sp.kategori);
  // Slug yang tidak ada di DB diabaikan (bukan error): tampil semua kategori.
  const kategori = kategoriList.find((k) => k.slug === slug);
  const q = parseQ(sp.q);
  const urut = parseUrut(sp.urut);
  const hasil = await cariProduk({
    kategori: kategori?.slug,
    q,
    urut,
    halaman: parseHalaman(sp.halaman),
  });
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-3xl font-bold text-fg">{kategori ? kategori.name : "Semua Produk"}</h1>
        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <FilterProduk kategori={kategori?.slug} q={q} urut={urut} daftarKategori={kategoriList} />
        </div>
        <p className="mt-6 text-sm text-muted" role="status" data-testid="jumlah-hasil">
          {hasil.total === 0
            ? "Tidak ada produk yang cocok."
            : `Menampilkan ${hasil.total} produk${q ? ` untuk “${q}”` : ""} · halaman ${hasil.halaman} dari ${hasil.jumlahHalaman}`}
        </p>
        {hasil.items.length === 0 ? (
          <div
            className="mt-6 rounded-lg border border-dashed border-border p-10 text-center"
            data-testid="kosong"
          >
            <p className="font-medium text-fg">Produk tidak ditemukan</p>
            <p className="mt-1 text-muted">Coba kata kunci lain atau hapus filter.</p>
            <a href="/produk" className="mt-4 inline-block font-medium text-primary underline">
              Lihat semua produk
            </a>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="daftar-produk">
            {hasil.items.map((p, i) => (
              <li key={p.id}>
                <KartuProduk produk={p} level={2} prioritas={i < 4} />
              </li>
            ))}
          </ul>
        )}
        <Paginasi
          halaman={hasil.halaman}
          jumlah={hasil.jumlahHalaman}
          kategori={kategori?.slug}
          q={q}
          urut={urut}
        />
      </Container>
    </main>
  );
}
