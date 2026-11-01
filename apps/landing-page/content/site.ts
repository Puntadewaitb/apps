/**
 * SEMUA konten landing page ada di file ini. Brand & data di bawah FIKTIF — ganti dengan milik Anda.
 * Nomor WhatsApp: format internasional tanpa "+".
 */
export const site = {
  brand: "Catatin Kas",
  tagline: "Pembukuan UMKM yang beres dalam 5 menit sehari",
  description:
    "Catatin Kas membantu pemilik usaha kecil mencatat pemasukan dan pengeluaran, memantau untung rugi, dan membuat laporan tanpa pusing akuntansi.",
  locale: "id_ID",
  theme: "netral" as "netral" | "hangat" | "hijau",
  whatsapp: {
    phone: "6281234567890",
    message: "Halo Catatin Kas, saya ingin tahu lebih lanjut.",
    label: "Tanya via WhatsApp",
  },
  nav: [
    { label: "Beranda", href: "#beranda" },
    { label: "Masalah", href: "#masalah" },
    { label: "Keunggulan", href: "#keunggulan" },
    { label: "Kontak", href: "#kontak" },
  ],
  hero: {
    eyebrow: "Untuk warung, toko, dan usaha rumahan",
    headline: "Tahu untung-rugi usaha Anda tanpa buku besar yang ribet",
    subheadline:
      "Catat transaksi lewat HP, lihat laporan harian otomatis, dan tenang saat musim pajak. Mulai gratis, tanpa kartu kredit.",
    cta: { label: "Coba Gratis 14 Hari", href: "#kontak" },
    secondaryCta: { label: "Lihat Keunggulan", href: "#keunggulan" },
    image: { src: "/img/hero.svg", alt: "Ilustrasi dasbor laporan keuangan Catatin Kas" },
  },
  footer: {
    description: "Aplikasi pembukuan sederhana untuk usaha kecil Indonesia.",
    links: [
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Syarat & Ketentuan", href: "#" },
    ],
    copyright: `© ${new Date().getFullYear()} Catatin Kas. Brand fiktif untuk demo template.`,
  },
};

export type Site = typeof site;
