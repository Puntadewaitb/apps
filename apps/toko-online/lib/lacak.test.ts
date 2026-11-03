import { describe, expect, it } from "vitest";
import { NAMA_BUKTI, mimeBukti, periksaBukti, MAKS_BUKTI } from "./bukti";
import { TAHAP, bolehUnggahBukti, labelStatus, normalisasiKodePesanan } from "./lacak";
import { ORDER_STATUSES } from "./domain";

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
);
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
const JPG = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
]);
const t = (s: string) => new TextEncoder().encode(s);

describe("normalisasiKodePesanan", () => {
  it("menerima variasi penulisan → bentuk baku", () => {
    for (const x of [
      "TKO-K7M2XQ4P",
      "tko-k7m2xq4p",
      " tko k7m2xq4p ",
      "TKOK7M2XQ4P",
      "k7m2xq4p",
      "K7M-2XQ4P",
    ])
      expect(normalisasiKodePesanan(x), x).toBe("TKO-K7M2XQ4P");
  });
  it("bentuk tak sah → '' (alfabet tanpa 0/1/I/L/O, panjang pas)", () => {
    for (const x of [
      "",
      "TKO-",
      "TKO-K7M2XQ4",
      "TKO-K7M2XQ4PP",
      "TKO-K7M2XQ40",
      "TKO-K7M2XQ4I",
      "TKO-K7M2XQ4L",
      "x'; DROP--",
      "<script>",
      "TKO-K7M2XQ4P; --",
      undefined,
      null,
    ])
      expect(normalisasiKodePesanan(x), String(x)).toBe("");
  });
});

describe("status", () => {
  it("unggah bukti hanya saat MENUNGGU_BAYAR", () => {
    for (const s of ORDER_STATUSES) expect(bolehUnggahBukti(s), s).toBe(s === "MENUNGGU_BAYAR");
    expect(bolehUnggahBukti("apa-saja")).toBe(false);
  });
  it("label dikenal; status asing tidak membocorkan nilai mentah", () => {
    expect(labelStatus("DIKIRIM")).toBe("Dikirim");
    expect(labelStatus("<script>")).toBe("Tidak diketahui");
    expect(TAHAP.every((s) => ORDER_STATUSES.includes(s))).toBe(true);
    expect(TAHAP).not.toContain("DIBATALKAN");
  });
});

describe("periksaBukti (magic bytes, bukan nama/MIME klaim)", () => {
  it("PNG/JPEG/PDF sah; ekstensi mengikuti ISI berkas", () => {
    expect(periksaBukti(PNG, "image/png")).toMatchObject({ ok: true, bukti: { ext: "png" } });
    expect(periksaBukti(JPG, "image/jpeg")).toMatchObject({ ok: true, bukti: { ext: "jpg" } });
    expect(periksaBukti(PDF, "application/pdf")).toMatchObject({ ok: true, bukti: { ext: "pdf" } });
  });
  it("ditolak: kosong, terlalu besar, SVG/HTML/GIF/skrip/exe, MIME tidak cocok isi", () => {
    expect(periksaBukti(new Uint8Array(), "image/png")).toMatchObject({ ok: false });
    expect(
      periksaBukti(new Uint8Array(MAKS_BUKTI + 1).fill(0x25), "application/pdf"),
    ).toMatchObject({ ok: false });
    for (const [nama, b] of [
      ["svg", t('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
      ["html", t("<!doctype html><script>alert(1)</script>")],
      ["gif", t("GIF89a\x01\x00\x01\x00")],
      ["js", t("alert(1)")],
      ["exe", Uint8Array.from([0x4d, 0x5a, 0x90, 0])],
      ["php", t("<?php system($_GET[1]); ?>")],
    ] as const)
      expect(periksaBukti(b, "image/png"), nama).toMatchObject({ ok: false });
    expect(periksaBukti(PNG, "application/pdf")).toMatchObject({
      ok: false,
      pesan: expect.stringContaining("tidak sesuai"),
    });
    expect(periksaBukti(PDF, "image/png")).toMatchObject({ ok: false });
  });
  it("nama berkas tersimpan dibatasi regex (cegah path traversal saat dibaca)", () => {
    expect(NAMA_BUKTI.test("AbCdEfGhIjKlMnOpQr12.png")).toBe(true);
    for (const x of [
      "../etc/passwd",
      "a/b.png",
      "x.png",
      "AbCdEfGhIjKlMnOpQr12.svg",
      "AbCdEfGhIjKlMnOpQr12.png/../x",
      "AbCdEfGhIjKlMnOpQr12.PNG",
      "",
    ])
      expect(NAMA_BUKTI.test(x), x).toBe(false);
    expect(mimeBukti("a.pdf")).toBe("application/pdf");
    expect(mimeBukti("a.exe")).toBeUndefined();
  });
});
