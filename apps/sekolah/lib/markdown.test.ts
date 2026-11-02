import { describe, expect, it } from "vitest";
import { hrefAman, parseInline, parseMarkdown, teksPolos } from "./markdown";

describe("inline", () => {
  it("tebal, miring, kode, tautan aman", () => {
    expect(parseInline("a **b** *c* `d` [e](https://x.id/y)")).toEqual([
      { t: "text", text: "a " },
      { t: "strong", children: [{ t: "text", text: "b" }] },
      { t: "text", text: " " },
      { t: "em", children: [{ t: "text", text: "c" }] },
      { t: "text", text: " " },
      { t: "code", text: "d" },
      { t: "text", text: " " },
      { t: "link", href: "https://x.id/y", children: [{ t: "text", text: "e" }] },
    ]);
  });

  it("tautan berbahaya hanya jadi teks (tanpa href)", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,x",
      "//evil.example",
      "http://tidak-aman.example",
      "vbscript:x",
    ]) {
      const r = parseInline(`[klik](${bad})`);
      expect(
        r.some((n) => n.t === "link"),
        bad,
      ).toBe(false);
      expect(r[0], bad).toEqual({ t: "text", text: "klik" });
    }
    expect(hrefAman("/layanan")).toBe(true);
    expect(hrefAman("#bagian")).toBe(true);
    expect(hrefAman("mailto:a@b.id")).toBe(true);
    expect(hrefAman('https://x.id/"onmouseover=')).toBe(false);
  });

  it("escape backslash & penanda tak berpasangan dipertahankan", () => {
    expect(parseInline("\\*bukan miring\\*")).toEqual([{ t: "text", text: "*bukan miring*" }]);
    expect(parseInline("2 * 3 = 6")).toEqual([{ t: "text", text: "2 * 3 = 6" }]);
  });

  it("HTML mentah tidak diinterpretasi (tetap teks literal)", () => {
    const r = parseInline('<img src=x onerror="alert(1)"> <script>x</script>');
    expect(r).toEqual([{ t: "text", text: '<img src=x onerror="alert(1)"> <script>x</script>' }]);
  });

  it("bersarang dibatasi kedalamannya (tidak overflow stack)", () => {
    const dalam = "**".repeat(500) + "x" + "**".repeat(500);
    expect(() => parseInline(dalam)).not.toThrow();
  });
});

describe("blok", () => {
  const md = [
    "# Judul besar",
    "",
    "Paragraf satu",
    "lanjut baris dua.",
    "",
    "### Sub judul",
    "",
    "- satu",
    "- dua **tebal**",
    "",
    "1. pertama",
    "2) kedua",
    "",
    "> kutipan",
    "> berlanjut",
    "",
    "---",
    "",
    "![Peta](/img/hero.svg)",
    "",
    "```ts",
    "const x = '<b>';",
    "```",
  ].join("\n");

  it("memetakan semua jenis blok", () => {
    const b = parseMarkdown(md);
    expect(b.map((x) => x.t)).toEqual([
      "heading",
      "p",
      "heading",
      "ul",
      "ol",
      "quote",
      "hr",
      "img",
      "code",
    ]);
    expect(b[0]).toMatchObject({ t: "heading", level: 2 }); // # → h2
    expect(b[2]).toMatchObject({ t: "heading", level: 3 });
    expect(b[1]).toMatchObject({
      t: "p",
      children: [{ t: "text", text: "Paragraf satu lanjut baris dua." }],
    });
    expect(b[3]).toMatchObject({ t: "ul" });
    expect((b[3] as { items: unknown[] }).items).toHaveLength(2);
    expect((b[4] as { items: unknown[] }).items).toHaveLength(2);
    expect(b[7]).toEqual({ t: "img", alt: "Peta", src: "/img/hero.svg" });
    expect(b[8]).toEqual({ t: "code", lang: "ts", text: "const x = '<b>';" });
  });

  it("gambar hanya dari /img/ (sumber luar menjadi paragraf teks)", () => {
    for (const src of [
      "https://evil.example/x.png",
      "//evil.example/x.png",
      "javascript:alert(1)",
      "/img/../../etc/passwd.png",
    ]) {
      const b = parseMarkdown(`![x](${src})`);
      expect(
        b.some((x) => x.t === "img" && x.src === src),
        src,
      ).toBe(false);
    }
  });

  it("blok kode tanpa penutup tidak membuat loop tak hingga", () => {
    const b = parseMarkdown("```\nisi tanpa penutup\nbaris dua");
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ t: "code" });
  });

  it("input kosong / hanya spasi → tanpa blok", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("  \n\n  ")).toEqual([]);
  });

  it("teksPolos menggabungkan isi tanpa penanda", () => {
    expect(teksPolos("## Hai\n\nIni **penting** dan `kode`.\n\n- a\n- b")).toBe(
      "Hai Ini penting dan kode. a b",
    );
  });
});
