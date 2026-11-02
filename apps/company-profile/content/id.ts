/**
 * SEMUA konten website ada di folder `content/`. Nama perusahaan, alamat, kontak, dan angka di bawah FIKTIF —
 * ganti dengan milik Anda. Struktur divalidasi oleh `lib/konten-schema.ts` (dijalankan di unit test).
 */
import { layanan } from "./layanan.id";
import { tentang } from "./tentang.id";

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
  nav: [
    { label: "Beranda", href: "/" },
    { label: "Tentang", href: "/tentang" },
    { label: "Layanan", href: "/layanan" },
  ],
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
  keunggulan: {
    judul: "Mengapa memilih Cakra Mandiri",
    subjudul:
      "Pendekatan kami dirancang agar hasilnya terasa di operasional, bukan hanya di dokumen.",
    butir: [
      {
        ikon: "🎯",
        judul: "Berorientasi hasil",
        teks: "Setiap proyek punya indikator keberhasilan yang disepakati di awal.",
      },
      {
        ikon: "🧩",
        judul: "Satu mitra, satu rangkaian",
        teks: "Dari analisis proses, sistem, hingga pelatihan — saling terhubung.",
      },
      {
        ikon: "🔐",
        judul: "Data aman & milik Anda",
        teks: "Kerahasiaan terjaga; kode dan dokumentasi diserahkan kepada klien.",
      },
      {
        ikon: "🤝",
        judul: "Pendampingan nyata",
        teks: "Kami bekerja bersama tim Anda sampai prosesnya berjalan mandiri.",
      },
    ],
  },
  layananRingkas: {
    judul: "Layanan Kami",
    subjudul: "Empat layanan yang saling melengkapi untuk membantu bisnis Anda bertumbuh.",
    tautan: { label: "Lihat semua layanan", href: "/layanan" },
  },
  layananHalaman: {
    judul: "Layanan",
    pengantar:
      "Pilih layanan yang paling sesuai dengan kebutuhan Anda, atau gabungkan beberapa layanan dalam satu program.",
    cta: "Lihat detail",
    terkaitJudul: "Layanan terkait",
    faqJudul: "Pertanyaan yang sering diajukan",
    tahapanJudul: "Tahapan kerja",
    manfaatJudul: "Manfaat",
    hasilJudul: "Yang Anda terima",
    breadcrumbBeranda: "Beranda",
    ajakanJudul: "Tertarik dengan layanan ini?",
    ajakanTeks: "Ceritakan kebutuhan Anda. Kami balas dalam 1 hari kerja.",
  },
  tentang,
  layanan,
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
