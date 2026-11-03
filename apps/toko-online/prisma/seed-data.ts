// Data demo FIKTIF (merek, produk, rekening). Murni data supaya bisa diimpor seed (Node type stripping) dan unit test.
// Hanya sintaks TypeScript yang bisa dihapus (tanpa enum/namespace).

export const DEMO_ADMIN_EMAIL = "admin@toko.example";

export const users = [
  // Password TIDAK ada di sini: akun dibuat dari env (lihat seed.ts).
  { email: DEMO_ADMIN_EMAIL, name: "Admin Toko", role: "ADMIN" },
  { email: "staf@toko.example", name: "Staf Toko", role: "STAFF" },
];

export const categories = [
  { slug: "kopi-teh", name: "Kopi & Teh", sort: 1 },
  { slug: "makanan-ringan", name: "Makanan Ringan", sort: 2 },
  { slug: "batik-kain", name: "Batik & Kain", sort: 3 },
  { slug: "kerajinan", name: "Kerajinan Tangan", sort: 4 },
  { slug: "rumah-tangga", name: "Perlengkapan Rumah", sort: 5 },
];

type V = { name: string; sku: string; price?: number; stock: number };
type P = {
  slug: string;
  name: string;
  kategori: string;
  price: number;
  deskripsi: string;
  varian: V[];
};

const std = (sku: string, stock: number): V[] => [{ name: "Standar", sku, stock }];

export const products: P[] = [
  {
    slug: "kopi-arabika-gayo-250g",
    name: "Kopi Arabika Gayo 250 g",
    kategori: "kopi-teh",
    price: 85000,
    deskripsi:
      "Biji kopi arabika single origin dari dataran tinggi Gayo, sangrai medium dengan aroma cokelat dan rempah.",
    varian: [
      { name: "Biji utuh", sku: "KOP-GAYO-B", stock: 40 },
      { name: "Bubuk halus", sku: "KOP-GAYO-H", stock: 30 },
    ],
  },
  {
    slug: "kopi-robusta-lampung-250g",
    name: "Kopi Robusta Lampung 250 g",
    kategori: "kopi-teh",
    price: 55000,
    deskripsi:
      "Robusta pilihan dengan body tebal dan crema pekat, cocok untuk kopi tubruk dan espresso.",
    varian: [
      { name: "Biji utuh", sku: "KOP-ROB-B", stock: 50 },
      { name: "Bubuk kasar", sku: "KOP-ROB-K", stock: 45 },
    ],
  },
  {
    slug: "teh-hijau-melati-100g",
    name: "Teh Hijau Melati 100 g",
    kategori: "kopi-teh",
    price: 38000,
    deskripsi: "Daun teh hijau yang diharumkan bunga melati asli. Seduh 3 menit pada suhu 80°C.",
    varian: std("TEH-MELATI", 60),
  },
  {
    slug: "teh-hitam-premium-100g",
    name: "Teh Hitam Premium 100 g",
    kategori: "kopi-teh",
    price: 42000,
    deskripsi: "Teh hitam orthodox dari kebun dataran tinggi; rasa pekat, sepat seimbang.",
    varian: std("TEH-HITAM", 55),
  },
  {
    slug: "keripik-tempe-original",
    name: "Keripik Tempe Original",
    kategori: "makanan-ringan",
    price: 22000,
    deskripsi: "Keripik tempe renyah tanpa pengawet, digoreng dengan minyak baru. Kemasan 150 g.",
    varian: [
      { name: "Original", sku: "KRP-TMP-O", stock: 80 },
      { name: "Pedas", sku: "KRP-TMP-P", stock: 70 },
    ],
  },
  {
    slug: "kacang-bawang-gurih",
    name: "Kacang Bawang Gurih",
    kategori: "makanan-ringan",
    price: 25000,
    deskripsi: "Kacang tanah sangrai berbalut adonan bawang gurih. Kemasan 200 g.",
    varian: std("KCG-BWG", 90),
  },
  {
    slug: "rengginang-singkong",
    name: "Rengginang Singkong",
    kategori: "makanan-ringan",
    price: 18000,
    deskripsi: "Rengginang renyah dari singkong dan bumbu tradisional. Kemasan 250 g.",
    varian: std("RGG-SKG", 75),
  },
  {
    slug: "dodol-garut-aneka-rasa",
    name: "Dodol Garut Aneka Rasa",
    kategori: "makanan-ringan",
    price: 32000,
    deskripsi: "Dodol lembut khas Garut. Pilih rasa original, durian, atau cokelat.",
    varian: [
      { name: "Original", sku: "DDL-O", stock: 40 },
      { name: "Durian", sku: "DDL-D", stock: 25 },
      { name: "Cokelat", sku: "DDL-C", stock: 35 },
    ],
  },
  {
    slug: "kain-batik-tulis-pekalongan",
    name: "Kain Batik Tulis Pekalongan",
    kategori: "batik-kain",
    price: 450000,
    deskripsi: "Batik tulis asli motif pesisir, katun primisima 2,5 meter. Setiap lembar unik.",
    varian: [
      { name: "Biru indigo", sku: "BTK-TLS-B", stock: 8 },
      { name: "Cokelat soga", sku: "BTK-TLS-C", stock: 6 },
    ],
  },
  {
    slug: "kemeja-batik-cap-pria",
    name: "Kemeja Batik Cap Pria",
    kategori: "batik-kain",
    price: 185000,
    deskripsi: "Kemeja batik cap lengan panjang, bahan katun adem. Tersedia ukuran M, L, XL.",
    varian: [
      { name: "M", sku: "KMJ-BTK-M", stock: 20 },
      { name: "L", sku: "KMJ-BTK-L", stock: 25 },
      { name: "XL", sku: "KMJ-BTK-XL", stock: 15, price: 195000 },
    ],
  },
  {
    slug: "selendang-tenun-lurik",
    name: "Selendang Tenun Lurik",
    kategori: "batik-kain",
    price: 120000,
    deskripsi: "Selendang lurik tenun tangan, ringan dan nyaman untuk harian maupun acara.",
    varian: std("SLD-LRK", 18),
  },
  {
    slug: "tas-anyaman-pandan",
    name: "Tas Anyaman Pandan",
    kategori: "kerajinan",
    price: 95000,
    deskripsi: "Tas tangan anyaman pandan dengan lapisan kain dan resleting. Ramah lingkungan.",
    varian: [
      { name: "Natural", sku: "TAS-PDN-N", stock: 22 },
      { name: "Hitam", sku: "TAS-PDN-H", stock: 18 },
    ],
  },
  {
    slug: "patung-kayu-garuda-20cm",
    name: "Patung Kayu Garuda 20 cm",
    kategori: "kerajinan",
    price: 240000,
    deskripsi: "Patung garuda ukir kayu jati, tinggi 20 cm, finishing halus.",
    varian: std("PTG-GRD", 10),
  },
  {
    slug: "gelang-perak-filigri",
    name: "Gelang Perak Filigri",
    kategori: "kerajinan",
    price: 275000,
    deskripsi: "Gelang perak 925 teknik filigri khas Kotagede. Ukuran dapat disesuaikan.",
    varian: [
      { name: "Ukuran S", sku: "GLG-PRK-S", stock: 9 },
      { name: "Ukuran M", sku: "GLG-PRK-M", stock: 12 },
    ],
  },
  {
    slug: "keranjang-rotan-serbaguna",
    name: "Keranjang Rotan Serbaguna",
    kategori: "kerajinan",
    price: 130000,
    deskripsi: "Keranjang rotan anyaman rapat untuk penyimpanan atau dekorasi.",
    varian: [
      { name: "Kecil", sku: "KRJ-RTN-K", stock: 15 },
      { name: "Besar", sku: "KRJ-RTN-B", stock: 10, price: 175000 },
    ],
  },
  {
    slug: "taplak-meja-batik",
    name: "Taplak Meja Batik",
    kategori: "rumah-tangga",
    price: 78000,
    deskripsi: "Taplak meja batik cap ukuran 120×160 cm, mudah dicuci.",
    varian: std("TPL-BTK", 30),
  },
  {
    slug: "set-cangkir-keramik-4pcs",
    name: "Set Cangkir Keramik 4 pcs",
    kategori: "rumah-tangga",
    price: 160000,
    deskripsi:
      "Set empat cangkir keramik glasir tangan, aman untuk microwave dan mesin cuci piring.",
    varian: [
      { name: "Putih", sku: "CKR-KRM-P", stock: 14 },
      { name: "Hijau celadon", sku: "CKR-KRM-H", stock: 11 },
    ],
  },
  {
    slug: "lilin-aromaterapi-sereh",
    name: "Lilin Aromaterapi Sereh",
    kategori: "rumah-tangga",
    price: 65000,
    deskripsi: "Lilin soya aroma sereh, nyala bersih hingga 40 jam.",
    varian: std("LLN-SRH", 28),
  },
  {
    slug: "sapu-ijuk-gagang-bambu",
    name: "Sapu Ijuk Gagang Bambu",
    kategori: "rumah-tangga",
    price: 35000,
    deskripsi: "Sapu ijuk tradisional dengan gagang bambu kuat dan ringan.",
    varian: std("SPU-IJK", 0) /* sengaja habis: uji tampilan stok kosong */,
  },
  {
    slug: "madu-hutan-murni-250ml",
    name: "Madu Hutan Murni 250 ml",
    kategori: "kopi-teh",
    price: 98000,
    deskripsi: "Madu hutan murni tanpa campuran gula, dipanen secara lestari oleh petani lokal.",
    varian: [
      { name: "250 ml", sku: "MDU-250", stock: 33 },
      { name: "500 ml", sku: "MDU-500", stock: 20, price: 185000 },
    ],
  },
];

export const vouchers = [
  {
    code: "HEMAT10",
    type: "PERSEN",
    value: 10,
    minSubtotal: 100000,
    maxDiscount: 50000,
    quota: null,
    used: 0,
    active: true,
    hariMulai: -30,
    hariSelesai: 365,
  },
  {
    code: "POTONG25K",
    type: "NOMINAL",
    value: 25000,
    minSubtotal: 200000,
    maxDiscount: null,
    quota: 100,
    used: 0,
    active: true,
    hariMulai: -30,
    hariSelesai: 365,
  },
  {
    code: "KADALUARSA",
    type: "PERSEN",
    value: 50,
    minSubtotal: 0,
    maxDiscount: null,
    quota: null,
    used: 0,
    active: true,
    hariMulai: -400,
    hariSelesai: -30,
  },
  {
    code: "HABIS",
    type: "NOMINAL",
    value: 10000,
    minSubtotal: 0,
    maxDiscount: null,
    quota: 5,
    used: 5,
    active: true,
    hariMulai: -30,
    hariSelesai: 365,
  },
  {
    code: "NONAKTIF",
    type: "PERSEN",
    value: 20,
    minSubtotal: 0,
    maxDiscount: null,
    quota: null,
    used: 0,
    active: false,
    hariMulai: -30,
    hariSelesai: 365,
  },
];

export const settings: Record<string, string> = {
  "toko.nama": "Toko Nusantara Craft",
  "toko.tagline": "Kopi, camilan, batik, dan kerajinan pilihan dari seluruh Nusantara",
  "toko.whatsapp": "6281234567890",
  "toko.alamat": "Jl. Kenanga No. 12, Yogyakarta (alamat fiktif untuk demo)",
  "toko.rekening": JSON.stringify([
    { bank: "Bank Nusantara", nomor: "1234 5678 90", atasNama: "Toko Nusantara Craft" },
    { bank: "Bank Contoh Syariah", nomor: "7001 2345 678", atasNama: "Toko Nusantara Craft" },
  ]),
  // Gambar QRIS = placeholder (bukan kode QR sungguhan)
  "toko.qris": "/img/qris.svg",
  "toko.catatanBayar":
    "Transfer sesuai total pesanan, lalu kirim bukti bayar lewat halaman Lacak Pesanan.",
  // Ongkir manual: tarif per kota (huruf kecil) + tarif bawaan untuk kota lain
  "toko.ongkir": JSON.stringify({
    bawaan: 25000,
    kota: { yogyakarta: 10000, jakarta: 18000, bandung: 18000, surabaya: 20000, semarang: 15000 },
  }),
};

export const kategoriDari = (slug: string) => categories.find((c) => c.slug === slug);
