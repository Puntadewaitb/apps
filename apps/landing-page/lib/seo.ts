import type { Site } from "../content/site";

export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  return raw.replace(/\/+$/, "");
}

/** "Rp 149.000" → 149000; "Rp 0" → 0. NaN bila tidak ada angka. */
export function parsePriceIdr(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.NaN;
}

/** Serialisasi JSON-LD aman untuk disisipkan di <script>: cegah penutupan tag lewat "<". */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}

/** Structured data: Organization, WebSite, SoftwareApplication (+ Offer), FAQPage. Tanpa rating (testimoni demo fiktif). */
export function buildStructuredData(site: Site, url: string) {
  const offers = site.showcase.items
    .map((i) => ({ name: i.name, price: parsePriceIdr(i.price) }))
    .filter((o) => Number.isFinite(o.price))
    .map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organisasi`,
        name: site.brand,
        url,
        logo: `${url}/icon.svg`,
        description: site.footer.description,
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#situs`,
        url,
        name: site.brand,
        inLanguage: "id-ID",
        publisher: { "@id": `${url}/#organisasi` },
      },
      {
        "@type": "SoftwareApplication",
        name: site.brand,
        description: site.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "id-ID",
        offers,
      },
      {
        "@type": "FAQPage",
        mainEntity: site.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
