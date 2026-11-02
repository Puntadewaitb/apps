import { describe, expect, it } from "vitest";
import {
  geserBulan,
  gridBulan,
  hariKegiatan,
  kunciBulan,
  parseBulan,
  petaPerHari,
  rentangBulanWib,
} from "./agenda";

describe("parseBulan", () => {
  it("menerima YYYY-MM valid saja", () => {
    expect(parseBulan("2027-02")).toEqual({ tahun: 2027, bulan: 2 });
    expect(parseBulan(["2026-12", "x"])).toEqual({ tahun: 2026, bulan: 12 });
    for (const v of [
      undefined,
      "",
      "2027-13",
      "2027-00",
      "2027-2",
      "27-02",
      "1999-12",
      "2101-01",
      "2027-02-01",
      "<script>",
      "2027-02\n",
      " 2027-02",
    ]) {
      expect(parseBulan(v), String(v)).toBeNull();
    }
  });
});

describe("geserBulan & kunciBulan", () => {
  it("melintasi batas tahun", () => {
    expect(geserBulan(2026, 12, 1)).toEqual({ tahun: 2027, bulan: 1 });
    expect(geserBulan(2027, 1, -1)).toEqual({ tahun: 2026, bulan: 12 });
    expect(geserBulan(2026, 5, 0)).toEqual({ tahun: 2026, bulan: 5 });
    expect(geserBulan(2026, 11, 14)).toEqual({ tahun: 2028, bulan: 1 });
    expect(kunciBulan(2027, 3)).toBe("2027-03");
  });
});

describe("gridBulan", () => {
  it("minggu mulai Senin; tiap minggu 7 sel; mencakup seluruh hari bulan", () => {
    // Februari 2027: 1 Feb = Senin, 28 hari → tepat 4 minggu
    const feb = gridBulan(2027, 2);
    expect(feb).toHaveLength(4);
    expect(feb[0]![0]).toEqual({ tanggal: "2027-02-01", hari: 1, diBulanIni: true });
    expect(feb[3]![6]).toEqual({ tanggal: "2027-02-28", hari: 28, diBulanIni: true });
    // Februari 2028 kabisat (29 hari), 1 Feb 2028 = Selasa
    const kab = gridBulan(2028, 2).flat();
    expect(kab.filter((s) => s.diBulanIni)).toHaveLength(29);
    expect(kab[0]!.tanggal).toBe("2028-01-31");
    expect(kab[0]!.diBulanIni).toBe(false);
  });

  it("jumlah sel kelipatan 7, berurutan tanpa celah, 4–6 minggu, untuk 10 tahun penuh", () => {
    for (let t = 2024; t <= 2033; t++)
      for (let b = 1; b <= 12; b++) {
        const g = gridBulan(t, b);
        expect(g.length, `${t}-${b}`).toBeGreaterThanOrEqual(4);
        expect(g.length, `${t}-${b}`).toBeLessThanOrEqual(6);
        const flat = g.flat();
        for (let i = 1; i < flat.length; i++) {
          const prev = new Date(`${flat[i - 1]!.tanggal}T00:00:00Z`).getTime();
          expect(new Date(`${flat[i]!.tanggal}T00:00:00Z`).getTime() - prev).toBe(86_400_000);
        }
        expect(new Date(`${flat[0]!.tanggal}T00:00:00Z`).getUTCDay()).toBe(1); // Senin
      }
  });
});

describe("hariKegiatan (zona WIB)", () => {
  const k = (s: string, e: string | null, id = 1) => ({
    id,
    startsAt: new Date(s),
    endsAt: e ? new Date(e) : null,
  });

  it("satu hari; tanpa akhir = satu hari", () => {
    expect(hariKegiatan(k("2027-02-13T09:00:00+07:00", "2027-02-13T16:00:00+07:00"))).toEqual([
      "2027-02-13",
    ]);
    expect(hariKegiatan(k("2027-02-13T09:00:00+07:00", null))).toEqual(["2027-02-13"]);
  });

  it("memakai tanggal WIB, bukan UTC (00.30 WIB = hari sebelumnya di UTC)", () => {
    expect(hariKegiatan(k("2027-02-13T00:30:00+07:00", null))).toEqual(["2027-02-13"]);
    expect(hariKegiatan(k("2027-02-13T23:30:00+07:00", null))).toEqual(["2027-02-13"]);
  });

  it("rentang multi-hari inklusif, melintasi batas bulan", () => {
    expect(hariKegiatan(k("2027-01-30T08:00:00+07:00", "2027-02-02T12:00:00+07:00"))).toEqual([
      "2027-01-30",
      "2027-01-31",
      "2027-02-01",
      "2027-02-02",
    ]);
  });

  it("akhir lebih awal dari mulai (data rusak) diperlakukan satu hari; rentang absurd dibatasi 62 hari", () => {
    expect(hariKegiatan(k("2027-02-13T09:00:00+07:00", "2027-02-01T09:00:00+07:00"))).toEqual([
      "2027-02-13",
    ]);
    expect(hariKegiatan(k("2027-01-01T00:00:00+07:00", "2035-01-01T00:00:00+07:00"))).toHaveLength(
      62,
    );
  });

  it("petaPerHari mengelompokkan beberapa kegiatan pada hari yang sama", () => {
    const m = petaPerHari([
      k("2027-02-13T09:00:00+07:00", null, 1),
      k("2027-02-12T09:00:00+07:00", "2027-02-14T09:00:00+07:00", 2),
    ]);
    expect(m.get("2027-02-13")).toEqual([1, 2]);
    expect(m.get("2027-02-12")).toEqual([2]);
    expect(m.get("2027-02-15")).toBeUndefined();
  });
});

describe("rentangBulanWib", () => {
  it("awal & akhir bulan dalam WIB (UTC+7)", () => {
    const { mulai, akhir } = rentangBulanWib(2027, 2);
    expect(mulai.toISOString()).toBe("2027-01-31T17:00:00.000Z");
    expect(akhir.toISOString()).toBe("2027-02-28T17:00:00.000Z");
    expect(rentangBulanWib(2026, 12).akhir.toISOString()).toBe("2026-12-31T17:00:00.000Z");
  });
});
