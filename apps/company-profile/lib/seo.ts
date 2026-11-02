/** SEO: URL situs, metadata per halaman (canonical + hreflang + OG), JSON-LD, dan daftar rute sitemap. */
import type { Metadata } from "next";
import { semuaArtikel } from "./blog";
import { LANGS, OG_LOCALE, localizeHref, type Lang } from "./i18n";
import { getBlog, getKonten, getUi, semuaLayanan, semuaProyek } from "./konten";

/** URL dasar situs tanpa trailing slash. Production: set NEXT_PUBLIC_SITE_URL. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/+$/, "");
}

/** URL absolut. Root tanpa trailing slash (sama seperti canonical yang dihasilkan Next): `https://situs` dan `https://situs/en`. */
export const absUrl = (lang: Lang, path: string) => {
  const p = localizeHref(lang, path);
  return `${siteUrl()}${p === "/" ? "" : p}`;
};

/** Path OG image (route handler `app/og/[lang]`). */
export const ogImagePath = (lang: Lang) => `/og/${lang}`;

type MetaOpts = {
  lang: Lang;
  /** Path internal tanpa awalan bahasa, mis. "/layanan/analitik-data". */
  path: string;
  /** Judul halaman (tanpa nama situs; template di layout menambahkannya). */
  title: string;
  description: string;
  type?: "website" | "article";
  extra?: Record<string, unknown>;
};

/** Metadata lengkap satu halaman: title, description, canonical, hreflang, OG, Twitter. */
export function pageMeta({
  lang,
  path,
  title,
  description,
  type = "website",
  extra,
}: MetaOpts): Metadata {
  const k = getKonten(lang);
  const nama = k.perusahaan.nama;
  const lainnya = LANGS.filter((l) => l !== lang);
  const gambar = [{ url: ogImagePath(lang), width: 1200, height: 630, alt: nama }];
  return {
    title,
    description,
    alternates: {
      canonical: localizeHref(lang, path),
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [l, localizeHref(l, path)])),
        "x-default": localizeHref("id", path),
      },
    },
    openGraph: {
      title: `${title} | ${nama}`,
      description,
      url: localizeHref(lang, path),
      siteName: nama,
      locale: OG_LOCALE[lang],
      alternateLocale: lainnya.map((l) => OG_LOCALE[l]),
      type,
      images: gambar,
      ...extra,
    } as Metadata["openGraph"],
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${nama}`,
      description,
      images: gambar.map((g) => g.url),
    },
  };
}

/** Serialisasi JSON-LD aman untuk disisipkan di <script>: "<" di-escape agar tak bisa menutup tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}

/** Organisasi/bisnis lokal (ProfessionalService ⊂ LocalBusiness). Data fiktif dari konten. */
export function organizationLd(lang: Lang) {
  const k = getKonten(lang);
  const s = k.kontak.struktur;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl()}/#organisasi`,
    name: k.perusahaan.namaLengkap,
    alternateName: k.perusahaan.nama,
    description: k.perusahaan.deskripsi,
    url: absUrl(lang, "/"),
    logo: `${siteUrl()}/icon.svg`,
    image: `${siteUrl()}${ogImagePath(lang)}`,
    foundingDate: String(k.perusahaan.tahunBerdiri),
    telephone: k.kontak.telepon,
    email: k.kontak.email,
    inLanguage: lang,
    address: {
      "@type": "PostalAddress",
      streetAddress: s.jalan,
      addressLocality: s.kota,
      addressRegion: s.provinsi,
      postalCode: s.kodePos,
      addressCountry: s.negara,
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: s.hari, opens: s.buka, closes: s.tutup },
    ],
    areaServed: { "@type": "Country", name: "Indonesia" },
    makesOffer: semuaLayanan(lang).map((l) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: l.nama,
        description: l.ringkas,
        url: absUrl(lang, `/layanan/${l.slug}`),
      },
    })),
  };
}

export function websiteLd(lang: Lang) {
  const k = getKonten(lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: k.perusahaan.nama,
    url: absUrl(lang, "/"),
    inLanguage: lang,
    publisher: { "@id": `${siteUrl()}/#organisasi` },
  };
}

export type Remah = Array<{ nama: string; path: string }>;

export function breadcrumbLd(lang: Lang, remah: Remah) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: remah.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.nama,
      item: absUrl(lang, r.path),
    })),
  };
}

export function layananLd(lang: Lang, slug: string) {
  const l = semuaLayanan(lang).find((x) => x.slug === slug);
  if (!l) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: l.nama,
    description: l.ringkas,
    url: absUrl(lang, `/layanan/${l.slug}`),
    inLanguage: lang,
    provider: { "@id": `${siteUrl()}/#organisasi` },
    areaServed: { "@type": "Country", name: "Indonesia" },
  };
}

export function artikelLd(lang: Lang, slug: string) {
  const a = semuaArtikel(lang).find((x) => x.slug === slug);
  if (!a) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.judul,
    description: a.ringkas,
    datePublished: a.tanggal,
    inLanguage: lang,
    author: { "@type": "Person", name: a.penulis },
    publisher: { "@id": `${siteUrl()}/#organisasi` },
    image: `${siteUrl()}${a.gambar}`,
    mainEntityOfPage: absUrl(lang, `/blog/${a.slug}`),
  };
}

export type RuteSitemap = { path: string; lastModified?: string };

/** Semua path publik (tanpa awalan bahasa). ID & EN memiliki himpunan path yang sama. */
export function semuaRute(lang: Lang = "id"): RuteSitemap[] {
  const statis = ["/", "/tentang", "/layanan", "/portofolio", "/blog", "/kontak"].map((path) => ({
    path,
  }));
  const blog = getBlog(lang);
  return [
    ...statis,
    ...semuaLayanan(lang).map((l) => ({ path: `/layanan/${l.slug}` })),
    ...semuaProyek(lang).map((p) => ({ path: `/portofolio/${p.slug}` })),
    ...blog.kategori.map((c) => ({ path: `/blog/kategori/${c.id}` })),
    ...semuaArtikel(lang).map((a) => ({ path: `/blog/${a.slug}`, lastModified: a.tanggal })),
  ];
}

export { getUi };
