import { describe, expect, it } from "vitest";
import { pendaftaranSchema, tanggalLahir } from "./ppdb-schema";

const valid = {
  studentName: "Budi Santoso",
  birthPlace: "Yogyakarta",
  birthDate: "2014-05-20",
  gender: "L",
  previousSchool: "SDN 1",
  address: "Jl. Melati No. 5, Sleman",
  targetGrade: "SMP Kelas 7",
  parentName: "Ahmad Santoso",
  parentPhone: "0812-3456-7890",
  parentEmail: "",
  parentJob: "Wiraswasta",
};

describe("pendaftaranSchema", () => {
  it("menerima data valid; HP dinormalkan 62…; email boleh kosong; tanggal jadi Date", () => {
    const r = pendaftaranSchema.parse(valid);
    expect(r.parentPhone).toBe("6281234567890");
    expect(r.parentEmail).toBe("");
    expect(r.birthDate).toBeInstanceOf(Date);
    expect(pendaftaranSchema.parse({ ...valid, parentEmail: "Ortu@Contoh.ID" }).parentEmail).toBe(
      "ortu@contoh.id",
    );
  });

  it("menolak: field wajib kosong/pendek, jenis kelamin & jenjang di luar daftar, HP/email salah", () => {
    for (const bad of [
      { studentName: "" },
      { studentName: "B" },
      { studentName: "Budi 123" },
      { birthPlace: "x" },
      { gender: "X" },
      { gender: "l" },
      { address: "pendek" },
      { targetGrade: "SMA Kelas 12" },
      { targetGrade: "" },
      { parentName: "" },
      { parentPhone: "123" },
      { parentPhone: "" },
      { parentEmail: "bukan-email" },
    ])
      expect(pendaftaranSchema.safeParse({ ...valid, ...bad }).success, JSON.stringify(bad)).toBe(
        false,
      );
  });

  it("tag HTML dibuang dari teks bebas", () => {
    const r = pendaftaranSchema.parse({
      ...valid,
      birthPlace: "Kota <b>Uji</b>",
      address: "Jl. <script>alert(1)</script>Melati No. 5, Sleman",
      previousSchool: "<img src=x onerror=alert(1)>SDN 1",
      parentJob: "<i>Guru</i>",
    });
    for (const v of [r.birthPlace, r.address, r.previousSchool, r.parentJob])
      expect(v).not.toMatch(/[<>]/);
  });

  it('karakter kontrol disaring (bukan disimpan) — "Budi\\u0000X" menjadi "BudiX"', () => {
    const r = pendaftaranSchema.parse({ ...valid, studentName: "Budi\u0000X" });
    expect(r.studentName).toBe("BudiX");
  });

  it("nama dengan karakter berbahaya ditolak oleh skema nama", () => {
    for (const n of ["<script>alert(1)</script>", "Budi'; DROP TABLE", "=cmd|' /C calc'!A0"]) {
      expect(pendaftaranSchema.safeParse({ ...valid, studentName: n }).success, n).toBe(false);
    }
  });
});

describe("tanggalLahir", () => {
  const skema = tanggalLahir(() => new Date("2026-11-03T00:00:00Z").getTime());
  it("menerima tanggal nyata dengan usia 3–25 tahun", () => {
    expect(skema.safeParse("2014-05-20").success).toBe(true);
    expect(skema.safeParse("2023-11-02").success).toBe(true); // 3 tahun lebih sehari
    expect(skema.safeParse("2001-12-01").success).toBe(true);
  });
  it("menolak tanggal fiktif, format salah, terlalu muda/tua, dan masa depan", () => {
    for (const v of [
      "",
      "2014-02-30",
      "2014-13-01",
      "2014-00-10",
      "20-05-2014",
      "2014/05/20",
      "2014-5-2",
      "abc",
      "2026-11-03",
      "2030-01-01",
      "1990-01-01",
      "2015-02-29",
      "2014-05-20T00:00",
      " 2014-05-20x",
    ])
      expect(skema.safeParse(v).success, v).toBe(false);
    expect(skema.safeParse("2016-02-29").success).toBe(true); // kabisat
  });
});
