/**
 * SEMUA konten website ada di folder `content/`. Nama perusahaan, alamat, kontak, dan angka di bawah FIKTIF —
 * ganti dengan milik Anda. Struktur divalidasi oleh `lib/konten-schema.ts` (dijalankan di unit test).
 */
export const konten = {
  tema: "netral" as "netral" | "hangat" | "hijau",
  perusahaan: {
    nama: "Cakra Mandiri",
    namaLengkap: "PT Cakra Mandiri Konsultan",
    tagline: "Mitra konsultasi & teknologi untuk bisnis yang bertumbuh",
    deskripsi:
      "Cakra Mandiri membantu perusahaan menengah merapikan proses bisnis, membangun sistem digital, dan mengembangkan tim — dengan pendekatan praktis dan terukur.",
    tahunBerdiri: 2012,
    locale: "id_ID",
  },
  nav: [{ label: "Beranda", href: "/" }],
  kontak: {
    telepon: "(021) 5551 2345",
    whatsapp: "6281234567890",
    pesanWhatsapp: "Halo Cakra Mandiri, saya ingin berkonsultasi.",
    email: "halo@cakramandiri.example",
    alamat:
      "Gedung Cakra Lt. 5, Jl. Sudirman No. 100, Jakarta Selatan 12190 (alamat fiktif untuk demo)",
    jamKerja: "Senin–Jumat, 08.30–17.00 WIB",
  },
  hero: {
    eyebrow: "Konsultan bisnis & teknologi sejak 2012",
    judul: "Proses yang rapi, sistem yang tepat, tim yang siap bertumbuh",
    subjudul:
      "Dari analisis proses hingga implementasi sistem dan pelatihan tim, kami mendampingi Anda sampai hasilnya terasa di operasional harian.",
    cta: { label: "Jadwalkan Konsultasi", href: "#kontak" },
    ctaSekunder: { label: "Hubungi via WhatsApp", href: "WHATSAPP" },
    gambar: {
      src: "/img/hero.svg",
      alt: "Ilustrasi tim sedang berdiskusi di depan papan analisis",
    },
  },
  ajakan: {
    judul: "Siap membahas kebutuhan perusahaan Anda?",
    teks: "Ceritakan tantangan Anda. Kami balas dalam 1 hari kerja dengan langkah awal yang konkret.",
  },
  footer: {
    deskripsi: "Konsultasi bisnis & teknologi untuk perusahaan menengah di Indonesia.",
    tautan: [
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Syarat & Ketentuan", href: "#" },
    ],
  },
};

export type Konten = typeof konten;
