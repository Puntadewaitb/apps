import { describe, expect, it } from "vitest";
import { fmt, isLang, localizeHref, prefixFor, stripLang } from "./i18n";

describe("i18n util", () => {
  it("isLang hanya menerima id/en", () => {
    expect(isLang("id")).toBe(true);
    expect(isLang("en")).toBe(true);
    for (const v of ["fr", "EN", "", "id/", undefined, null, 1, "__proto__"]) {
      expect(isLang(v), String(v)).toBe(false);
    }
  });

  it("prefixFor: id tanpa awalan, en berawalan", () => {
    expect(prefixFor("id")).toBe("");
    expect(prefixFor("en")).toBe("/en");
  });

  it("localizeHref: hanya path internal yang diberi awalan", () => {
    expect(localizeHref("id", "/layanan")).toBe("/layanan");
    expect(localizeHref("en", "/layanan")).toBe("/en/layanan");
    expect(localizeHref("en", "/")).toBe("/en");
    expect(localizeHref("en", "#kontak")).toBe("#kontak");
    expect(localizeHref("en", "https://example.com/x")).toBe("https://example.com/x");
    expect(localizeHref("en", "mailto:a@b.example")).toBe("mailto:a@b.example");
    // protocol-relative tidak boleh dijadikan "/en//evil.example"
    expect(localizeHref("en", "//evil.example")).toBe("//evil.example");
  });

  it("stripLang: kebalikan localizeHref", () => {
    for (const p of ["/", "/layanan", "/blog/kategori/tips"]) {
      expect(stripLang(localizeHref("en", p))).toBe(p);
      expect(stripLang(p)).toBe(p);
    }
    expect(stripLang("/id/layanan")).toBe("/layanan");
    expect(stripLang("/enx/layanan")).toBe("/enx/layanan");
    expect(stripLang("/english")).toBe("/english");
  });

  it("fmt: isi placeholder, biarkan yang tak dikenal", () => {
    expect(fmt("Halo {nama}, {n} item", { nama: "A", n: 3 })).toBe("Halo A, 3 item");
    expect(fmt("{x}", {})).toBe("{x}");
  });
});
