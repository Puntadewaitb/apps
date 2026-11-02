import { describe, expect, it } from "vitest";
import { semuaRute } from "./seo";
import { ruteDikenal, tanpaSlashAkhir } from "./rute";

describe("rute dikenal (gerbang 404 di proxy)", () => {
  const r = ruteDikenal();

  it("memuat semua halaman kedua bahasa dengan awalan yang benar", () => {
    for (const x of semuaRute("id")) expect(r.has(x.path), x.path).toBe(true);
    for (const x of semuaRute("en"))
      expect(r.has(x.path === "/" ? "/en" : `/en${x.path}`), x.path).toBe(true);
    expect(r.size).toBe(semuaRute("id").length * 2);
  });

  it("menolak path tak dikenal, beda kapitalisasi, traversal, dan awalan palsu", () => {
    for (const p of [
      "/tidak-ada",
      "/Layanan",
      "/layanan/",
      "/layanan/KONSULTASI-PROSES-BISNIS",
      "/layanan/__proto__",
      "/en/en",
      "/en/en/layanan",
      "/id",
      "/id/layanan",
      "/layanan/../admin",
      "/blog/kategori",
      "//evil.example",
      "",
    ]) {
      expect(r.has(p), p).toBe(false);
    }
  });

  it("tanpaSlashAkhir", () => {
    expect(tanpaSlashAkhir("/")).toBe("/");
    expect(tanpaSlashAkhir("/layanan/")).toBe("/layanan");
    expect(tanpaSlashAkhir("/en/")).toBe("/en");
    expect(tanpaSlashAkhir("/layanan")).toBe("/layanan");
  });
});
