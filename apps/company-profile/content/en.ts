/**
 * English version of the site content. MUST have the same shape as `id.ts` (enforced by TypeScript).
 * Company names, address, and figures are FICTIONAL — replace with your own.
 */
import type { konten as kontenId } from "./id";
import { kredibilitas } from "./kredibilitas.en";
import { layanan } from "./layanan.en";
import { portofolio } from "./portofolio.en";
import { tentang } from "./tentang.en";

export const konten: typeof kontenId = {
  tema: "netral",
  perusahaan: {
    nama: "Cakra Mandiri",
    namaLengkap: "PT Cakra Mandiri Konsultan",
    tagline: "Consulting & technology partner for growing businesses",
    deskripsi:
      "Cakra Mandiri helps mid-sized companies streamline business processes, build digital systems, and develop their teams — with a practical, measurable approach.",
    tahunBerdiri: 2012,
    locale: "en_US",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/tentang" },
    { label: "Services", href: "/layanan" },
    { label: "Portfolio", href: "/portofolio" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/kontak" },
  ],
  kontak: {
    telepon: "(021) 5551 2345",
    whatsapp: "6281234567890",
    pesanWhatsapp: "Hello Cakra Mandiri, I would like to arrange a consultation.",
    email: "halo@cakramandiri.example",
    alamat:
      "Cakra Building 5th Floor, Jl. Sudirman No. 100, South Jakarta 12190 (fictional address for demo)",
    jamKerja: "Monday–Friday, 08:30–17:00 WIB",
    mapsUrl: "https://www.google.com/maps?q=Jl.+Jenderal+Sudirman+Jakarta&output=embed",
    struktur: {
      jalan: "Jl. Sudirman No. 100",
      kota: "Jakarta Selatan",
      provinsi: "DKI Jakarta",
      kodePos: "12190",
      negara: "ID",
      hari: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      buka: "08:30",
      tutup: "17:00",
    },
  },
  hero: {
    eyebrow: "Business & technology consultants since 2012",
    judul: "Tidy processes, the right systems, teams ready to grow",
    subjudul:
      "From process analysis to system implementation and team training, we stay with you until the results show up in your daily operations.",
    cta: { label: "Schedule a Consultation", href: "/kontak" },
    ctaSekunder: { label: "Contact via WhatsApp", href: "WHATSAPP" },
    gambar: {
      src: "/img/hero.svg",
      alt: "Illustration of a team discussing in front of an analysis board",
    },
  },
  keunggulan: {
    judul: "Why choose Cakra Mandiri",
    subjudul: "Our approach is designed so results are felt in operations, not just in documents.",
    butir: [
      {
        ikon: "🎯",
        judul: "Results-oriented",
        teks: "Every project has success indicators agreed on at the start.",
      },
      {
        ikon: "🧩",
        judul: "One partner, one chain",
        teks: "From process analysis to systems to training — all connected.",
      },
      {
        ikon: "🔐",
        judul: "Secure data, owned by you",
        teks: "Confidentiality is protected; code and documentation are handed to the client.",
      },
      {
        ikon: "🤝",
        judul: "Real support",
        teks: "We work alongside your team until the process runs on its own.",
      },
    ],
  },
  layananRingkas: {
    judul: "Our Services",
    subjudul: "Four complementary services to help your business grow.",
    tautan: { label: "See all services", href: "/layanan" },
  },
  layananHalaman: {
    judul: "Services",
    pengantar:
      "Choose the service that best fits your needs, or combine several services in one program.",
    cta: "View details",
    terkaitJudul: "Related services",
    faqJudul: "Frequently asked questions",
    tahapanJudul: "How we work",
    manfaatJudul: "Benefits",
    hasilJudul: "What you receive",
    breadcrumbBeranda: "Home",
    ajakanJudul: "Interested in this service?",
    ajakanTeks: "Tell us what you need. We reply within 1 business day.",
  },
  tentang,
  layanan,
  portofolio,
  kredibilitas,
  ajakan: {
    judul: "Ready to discuss your company's needs?",
    teks: "Tell us about your challenge. We reply within 1 business day with a concrete first step.",
  },
  footer: {
    deskripsi: "Business & technology consulting for mid-sized companies in Indonesia.",
    tautan: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms & Conditions", href: "#" },
    ],
  },
};
