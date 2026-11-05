// OVERLAY sample statis: halaman katalog statis; penyaringan terjadi di peramban (components/KatalogKlien.tsx).
import type { Metadata } from "next";
import { KatalogKlien } from "../../../components/KatalogKlien";

export const metadata: Metadata = {
  title: "Semua Produk",
  description:
    "Telusuri produk pilihan: filter kategori, cari nama produk, dan urutkan berdasarkan harga.",
};

export default function KatalogPage() {
  return <KatalogKlien />;
}
