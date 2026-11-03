import { describe, expect, it } from "vitest";
import { terbukaUntukDonasi } from "./donasi";
import { konfirmasiSchema, programSchema } from "./donasi-schema";

describe("konfirmasiSchema", () => {
  const ok = {
    donorName: "Budi Santoso",
    amount: "150.000",
    message: "Semoga berkah",
    anonymous: "on",
  };
  it("menerima data valid; nominal → angka; centang anonim → boolean", () => {
    const r = konfirmasiSchema.parse(ok);
    expect(r.amount).toBe(150000);
    expect(r.anonymous).toBe(true);
    expect(konfirmasiSchema.parse({ ...ok, anonymous: undefined, message: "" }).anonymous).toBe(
      false,
    );
  });
  it("menolak nama berbahaya/pendek, nominal salah, pesan terlalu panjang", () => {
    for (const bad of [
      { donorName: "" },
      { donorName: "B" },
      { donorName: "<script>alert(1)</script>" },
      { donorName: "=cmd|' /C calc'!A0" },
      { amount: "" },
      { amount: "5000" },
      { amount: "1,5 juta" },
      { amount: "2.000.000.000" },
      { amount: "-100000" },
      { message: "x".repeat(301) },
    ])
      expect(konfirmasiSchema.safeParse({ ...ok, ...bad }).success, JSON.stringify(bad)).toBe(
        false,
      );
  });
  it("tag HTML pada pesan dibuang", () => {
    const r = konfirmasiSchema.parse({
      ...ok,
      message: "Halo <script>alert(1)</script><b>dunia</b>",
    });
    expect(r.message).not.toMatch(/[<>]/);
  });
});

describe("programSchema", () => {
  const ok = {
    title: "Beasiswa Siswa Berprestasi",
    description: "Membantu biaya pendidikan siswa berprestasi.",
    target: "75.000.000",
    deadline: "2027-06-30",
    active: "on",
  };
  it("valid; deadline 23.59 WIB; kosong = tanpa batas", () => {
    const r = programSchema.parse(ok);
    expect(r.target).toBe(75_000_000);
    expect(r.deadline?.toISOString()).toBe("2027-06-30T16:59:00.000Z");
    expect(programSchema.parse({ ...ok, deadline: "" }).deadline).toBeNull();
    expect(programSchema.parse({ ...ok, active: undefined }).active).toBe(false);
  });
  it("menolak target terlalu kecil/besar, tanggal fiktif, judul/deskripsi pendek", () => {
    for (const bad of [
      { target: "99.999" },
      { target: "100.000.000.001" },
      { target: "abc" },
      { deadline: "2027-02-30" },
      { deadline: "30-06-2027" },
      { title: "abc" },
      { description: "pendek" },
    ])
      expect(programSchema.safeParse({ ...ok, ...bad }).success, JSON.stringify(bad)).toBe(false);
  });
});

describe("terbukaUntukDonasi", () => {
  const now = new Date("2026-11-03T00:00:00Z");
  it("aktif & (tanpa batas atau belum lewat)", () => {
    expect(terbukaUntukDonasi({ active: true, deadline: null }, now)).toBe(true);
    expect(
      terbukaUntukDonasi({ active: true, deadline: new Date("2026-11-04T00:00:00Z") }, now),
    ).toBe(true);
    expect(
      terbukaUntukDonasi({ active: true, deadline: new Date("2026-11-02T00:00:00Z") }, now),
    ).toBe(false);
    expect(terbukaUntukDonasi({ active: true, deadline: now }, now)).toBe(false);
    expect(terbukaUntukDonasi({ active: false, deadline: null }, now)).toBe(false);
  });
});
