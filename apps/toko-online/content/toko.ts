/** Identitas toko bawaan (FIKTIF). Nilai yang bisa diedit admin (nama, WA, rekening, ongkir) ada di tabel Setting (T7). */
export const toko = {
  tema: "hangat" as "netral" | "hangat" | "hijau",
  nama: "Toko Nusantara Craft",
  tagline: "Kopi, camilan, batik, dan kerajinan pilihan dari seluruh Nusantara",
  deskripsi:
    "Toko Nusantara Craft (fiktif) menghadirkan produk lokal berkualitas langsung dari pengrajin dan petani di berbagai daerah.",
  nav: [
    { label: "Beranda", href: "/" },
    { label: "Produk", href: "/produk" },
    { label: "Lacak Pesanan", href: "/lacak" },
  ],
};
export type Toko = typeof toko;
