import { describe, expect, it } from "vitest";
import { MAX_BARIS, buatKodeTamu, parseDaftarTamu, tautanTamu, tautanWhatsApp } from "./tamu";
import { KODE_RE } from "./schemas";

describe("parseDaftarTamu", () => {
  it("hanya nama → default 2 orang tanpa HP; baris kosong & spasi diabaikan", () => {
    const r = parseDaftarTamu("\n  Bapak Budi & Keluarga  \n\n  Ibu Dewi\r\n");
    expect(r.galat).toEqual([]);
    expect(r.valid).toEqual([
      { name: "Bapak Budi & Keluarga", maxPax: 2, phone: "" },
      { name: "Ibu Dewi", maxPax: 2, phone: "" },
    ]);
  });

  it("nama; jumlah; HP → HP dinormalkan ke 62…", () => {
    const r = parseDaftarTamu("Dr. Siti, M.Sc.; 4; 0812-3456-7890");
    expect(r.galat).toEqual([]);
    expect(r.valid[0]).toEqual({ name: "Dr. Siti, M.Sc.", maxPax: 4, phone: "6281234567890" });
  });

  it("galat per baris dengan nomor baris yang benar", () => {
    const r = parseDaftarTamu("Ani; 3\n; 2\nBudi; 99\nCici; dua\nDedi; 2; 123\nEko; 0");
    expect(r.valid.map((v) => v.name)).toEqual(["Ani"]);
    expect(r.galat).toEqual([
      { baris: 2, pesan: "Nama kosong" },
      { baris: 3, pesan: "Jumlah orang harus 1–20" },
      { baris: 4, pesan: "Jumlah orang harus 1–20" },
      { baris: 5, pesan: "Nomor HP tidak valid" },
      { baris: 6, pesan: "Jumlah orang harus 1–20" },
    ]);
  });

  it("tag HTML pada nama dibuang; nama dipotong 60 karakter", () => {
    const r = parseDaftarTamu(`<script>alert(1)</script>Ani\n${"A".repeat(200)}`);
    expect(r.valid[0]!.name).not.toMatch(/[<>]/);
    expect(r.valid[1]!.name).toHaveLength(60);
  });

  it(`maksimal ${MAX_BARIS} tamu per pengiriman`, () => {
    const teks = Array.from({ length: MAX_BARIS + 5 }, (_, i) => `Tamu ${i}`).join("\n");
    const r = parseDaftarTamu(teks);
    expect(r.valid).toHaveLength(MAX_BARIS);
    expect(r.galat).toHaveLength(1);
    expect(r.galat[0]!.pesan).toContain(String(MAX_BARIS));
  });
});

describe("kode & tautan", () => {
  it("buatKodeTamu: cocok KODE_RE, tidak ambigu, tidak berulang", () => {
    const set = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const k = buatKodeTamu();
      expect(k).toMatch(KODE_RE);
      expect(k).not.toMatch(/[01OIL]/);
      set.add(k);
    }
    expect(set.size).toBe(300);
  });

  it("tautanTamu & tautanWhatsApp", () => {
    expect(tautanTamu("https://contoh.id", "AB12-CD")).toBe("https://contoh.id/?kode=AB12-CD");
    const wa = tautanWhatsApp({
      phone: "6281234567890",
      nama: "Ani",
      tautan: "https://x.id/?kode=K1",
      acara: "Pernikahan Raka & Anisa",
    });
    expect(wa.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
    expect(decodeURIComponent(wa)).toContain("https://x.id/?kode=K1");
    expect(
      tautanWhatsApp({ phone: "", nama: "A", tautan: "t", acara: "x" }).startsWith(
        "https://wa.me/?text=",
      ),
    ).toBe(true);
  });
});
