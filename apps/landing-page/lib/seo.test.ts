import { describe, expect, it } from "vitest";
import { site } from "../content/site";
import { buildStructuredData, jsonLdString, parsePriceIdr, siteUrl } from "./seo";

describe("seo", () => {
  it("siteUrl: default & buang slash akhir", () => {
    expect(siteUrl({})).toBe("http://localhost:3001");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://contoh.id///" })).toBe("https://contoh.id");
  });

  it("parsePriceIdr", () => {
    expect(parsePriceIdr("Rp 149.000")).toBe(149000);
    expect(parsePriceIdr("Rp 0")).toBe(0);
    expect(parsePriceIdr("Hubungi kami")).toBeNaN();
  });

  it("jsonLdString menetralkan </script> dan karakter pemisah baris", () => {
    const s = jsonLdString({ a: "</script><script>alert(1)</script>\u2028" });
    expect(s).not.toContain("<");
    expect(s).not.toContain("\u2028");
    expect(JSON.parse(s).a).toBe("</script><script>alert(1)</script>\u2028");
  });

  it("structured data: offer per paket & FAQ lengkap, tanpa rating", () => {
    const g = buildStructuredData(site, "https://contoh.id")["@graph"];
    const types = g.map((n) => n["@type"]);
    expect(types).toEqual(["Organization", "WebSite", "SoftwareApplication", "FAQPage"]);
    const app = g.find((n) => n["@type"] === "SoftwareApplication") as { offers: unknown[] };
    expect(app.offers).toHaveLength(site.showcase.items.length);
    const faq = g.find((n) => n["@type"] === "FAQPage") as { mainEntity: unknown[] };
    expect(faq.mainEntity).toHaveLength(site.faq.items.length);
    expect(JSON.stringify(g)).not.toContain("aggregateRating");
  });
});
