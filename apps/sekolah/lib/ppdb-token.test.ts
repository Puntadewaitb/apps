import { describe, expect, it, vi } from "vitest";
import {
  NOMOR_RE,
  TOKEN_RE,
  buatNomor,
  buatToken,
  hashToken,
  normalisasiToken,
  periksaStatus,
  samaHash,
  type CekDeps,
  type RegistrasiRingkas,
} from "./ppdb-token";

describe("nomor & token", () => {
  it("nomor acak berformat PPDB-<tahun>-<6 huruf/angka>; tidak berurutan/berulang", () => {
    const set = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const n = buatNomor(2027);
      expect(n).toMatch(NOMOR_RE);
      expect(n.startsWith("PPDB-2027-")).toBe(true);
      set.add(n);
    }
    expect(set.size).toBe(2000);
  });

  it("token: XXXX-XXXX-XXXX, alfabet tanpa karakter membingungkan, kanonik 12 karakter", () => {
    for (let i = 0; i < 500; i++) {
      const t = buatToken();
      expect(t).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
      expect(normalisasiToken(t)).toMatch(TOKEN_RE);
      expect(t).not.toMatch(/[01OIL]/);
    }
    expect(new Set(Array.from({ length: 1000 }, buatToken)).size).toBe(1000);
  });

  it("hash: deterministik, sama untuk variasi penulisan; beda token → beda hash; bukan token polos", () => {
    expect(hashToken("ABCD-EFGH-JKMN")).toBe(hashToken("abcd efgh jkmn"));
    expect(hashToken("ABCDEFGHJKMN")).toBe(hashToken(" abcd-efgh-jkmn "));
    expect(hashToken("ABCD-EFGH-JKMN")).not.toBe(hashToken("ABCD-EFGH-JKMP"));
    expect(hashToken("ABCD-EFGH-JKMN")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("ABCD-EFGH-JKMN")).not.toContain("ABCD");
  });

  it("samaHash: waktu-konstan, aman terhadap panjang/format aneh", () => {
    const h = hashToken("ABCD-EFGH-JKMN");
    expect(samaHash(h, h)).toBe(true);
    for (const x of ["", "zz", h.slice(0, 62), `${h}00`, "g".repeat(64)])
      expect(samaHash(h, x), x).toBe(false);
    expect(samaHash("", "")).toBe(false);
  });
});

const NO = "PPDB-2027-K7M2XQ";
const TK = "ABCD-EFGH-JKMN";
const row = (over: Partial<RegistrasiRingkas> = {}): RegistrasiRingkas => ({
  regNo: NO,
  tokenHash: hashToken(TK),
  status: "BARU",
  adminNote: "",
  studentName: "Siswa Uji",
  targetGrade: "SMP Kelas 7",
  createdAt: new Date(),
  documents: "[]",
  ...over,
});
const deps = (over: Partial<CekDeps> = {}): CekDeps => ({
  cari: async (n) => (n === NO ? row() : null),
  limiterIp: () => ({ allowed: true }),
  limiterNomor: () => ({ allowed: true }),
  ...over,
});

describe("periksaStatus", () => {
  it("nomor + token benar (variasi penulisan diterima) → data", async () => {
    for (const [n, t] of [
      [NO, TK],
      [` ${NO.toLowerCase()} `, "abcd efgh jkmn"],
      [NO, "ABCDEFGHJKMN"],
    ] as const) {
      const r = await periksaStatus(n, t, "1.1.1.1", deps());
      expect(r.ok, `${n}/${t}`).toBe(true);
    }
  });

  it("token salah dan nomor tak dikenal → galat IDENTIK (tak membocorkan keberadaan nomor)", async () => {
    const salah = await periksaStatus(NO, "ZZZZ-ZZZZ-ZZZZ", "ip", deps());
    const takAda = await periksaStatus("PPDB-2027-AAAAAA", TK, "ip", deps());
    expect(salah).toEqual({ ok: false, galat: "TIDAK_COCOK" });
    expect(takAda).toEqual(salah);
  });

  it("format salah ditolak sebelum menyentuh limiter/DB", async () => {
    const cari = vi.fn();
    const lim = vi.fn(() => ({ allowed: true }));
    for (const [n, t] of [
      ["", ""],
      [NO, ""],
      ["", TK],
      ["PPDB-27-ABC", TK],
      [NO, "ABC"],
      ["' OR 1=1 --", TK],
      [NO, "ABCD-EFGH-JKM0"],
      [NO, "<script>"],
      ["PPDB-2027-K7M2X!", TK],
    ]) {
      expect(
        await periksaStatus(n!, t!, "ip", deps({ cari, limiterIp: lim, limiterNomor: lim })),
        `${n}|${t}`,
      ).toEqual({ ok: false, galat: "FORMAT" });
    }
    expect(cari).not.toHaveBeenCalled();
    expect(lim).not.toHaveBeenCalled();
  });

  it("rate limit IP atau nomor → RATE_LIMIT walau token benar; DB tak disentuh", async () => {
    const cari = vi.fn(async () => row());
    expect(
      await periksaStatus(NO, TK, "ip", deps({ cari, limiterIp: () => ({ allowed: false }) })),
    ).toEqual({ ok: false, galat: "RATE_LIMIT" });
    expect(
      await periksaStatus(NO, TK, "ip", deps({ cari, limiterNomor: () => ({ allowed: false }) })),
    ).toEqual({ ok: false, galat: "RATE_LIMIT" });
    expect(cari).not.toHaveBeenCalled();
  });

  it("kunci limiter memuat IP dan nomor ternormalisasi", async () => {
    const ip = vi.fn(() => ({ allowed: true }));
    const no = vi.fn(() => ({ allowed: true }));
    await periksaStatus(
      ` ${NO.toLowerCase()}`,
      TK,
      "9.9.9.9",
      deps({ limiterIp: ip, limiterNomor: no }),
    );
    expect(ip).toHaveBeenCalledWith("ip:9.9.9.9");
    expect(no).toHaveBeenCalledWith(`no:${NO}`);
  });

  it("hash rusak di DB → ditolak (bukan crash/lolos)", async () => {
    for (const tokenHash of ["", "bukan-hex", "00"]) {
      const r = await periksaStatus(NO, TK, "ip", deps({ cari: async () => row({ tokenHash }) }));
      expect(r, tokenHash).toEqual({ ok: false, galat: "TIDAK_COCOK" });
    }
  });
});
