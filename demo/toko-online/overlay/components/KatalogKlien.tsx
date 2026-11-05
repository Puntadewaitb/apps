"use client";

// OVERLAY sample statis: katalog /produk di PERAMBAN. Versi lengkap memfilter di server (searchParams + DB); hosting
// statis tidak punya keduanya, jadi pencarian, kategori, urutan, dan paginasi dihitung di sini dari data seed
// (lib/demo-data.json) dengan fungsi MURNI yang sama (diturunkan otomatis dari lib/katalog.ts).
// Render awal (server/hydration) = tampilan bawaan; setelah hydration mengikuti query URL.
import { useSyncExternalStore } from "react";
import { Container } from "@tpl/ui";
import dataMentah from "../lib/demo-data.json";
import {
  PER_HALAMAN,
  cocokKata,
  paginasi,
  parseHalaman,
  parseQ,
  parseSlug,
  parseUrut,
  urutkan,
} from "../lib/katalog-murni";
import { FilterProduk } from "./FilterProduk";
import { KartuProduk } from "./KartuProduk";
import { Paginasi } from "./Paginasi";

type Data = {
  kategori: Array<{ id: number; slug: string; name: string }>;
  produk: Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    price: number;
    image: string;
    createdAt: string;
    category: { slug: string; name: string };
    variants: Array<{ price: number | null; stock: number }>;
  }>;
};
const data = dataMentah as unknown as Data;
const semua = data.produk.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  image: p.image,
  createdAt: new Date(p.createdAt),
  category: p.category,
  variants: p.variants.map((v) => ({ price: v.price, stock: v.stock })),
}));

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function KatalogKlien() {
  const query = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const sp = new URLSearchParams(query);
  const slug = parseSlug(sp.get("kategori") ?? undefined);
  // Slug yang tidak ada diabaikan (bukan error): tampil semua kategori.
  const kategori = data.kategori.find((k) => k.slug === slug);
  const q = parseQ(sp.get("q") ?? undefined);
  const urut = parseUrut(sp.get("urut") ?? undefined);

  const dalamKategori = kategori ? semua.filter((p) => p.category.slug === kategori.slug) : semua;
  const cocok = q
    ? dalamKategori.filter((p) => cocokKata(q, p.name, p.description))
    : dalamKategori;
  const diurut = urutkan(cocok, urut);
  const { jumlahHalaman, halaman } = paginasi(
    diurut.length,
    parseHalaman(sp.get("halaman") ?? undefined),
  );
  const items = diurut.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN);
  const total = diurut.length;

  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-3xl font-bold text-fg">{kategori ? kategori.name : "Semua Produk"}</h1>
        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <FilterProduk
            kategori={kategori?.slug}
            q={q}
            urut={urut}
            daftarKategori={data.kategori}
          />
        </div>
        <p className="mt-6 text-sm text-muted" role="status" data-testid="jumlah-hasil">
          {total === 0
            ? "Tidak ada produk yang cocok."
            : `Menampilkan ${total} produk${q ? ` untuk “${q}”` : ""} · halaman ${halaman} dari ${jumlahHalaman}`}
        </p>
        {items.length === 0 ? (
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
            {items.map((p, i) => (
              <li key={p.id}>
                <KartuProduk produk={p} level={2} prioritas={i < 4} />
              </li>
            ))}
          </ul>
        )}
        <Paginasi
          halaman={halaman}
          jumlah={jumlahHalaman}
          kategori={kategori?.slug}
          q={q}
          urut={urut}
        />
      </Container>
    </main>
  );
}
