import { describe, expect, it } from "vitest";
import { formatWaktuWib, parseWaktuWib } from "./waktu";

describe("waktu WIB (datetime-local)", () => {
  it("parse sebagai WIB (UTC+7) dan bolak-balik konsisten", () => {
    expect(parseWaktuWib("2027-02-13T09:00")!.toISOString()).toBe("2027-02-13T02:00:00.000Z");
    expect(parseWaktuWib("2027-02-13T00:30")!.toISOString()).toBe("2027-02-12T17:30:00.000Z");
    expect(parseWaktuWib("2027-12-31T23:59")!.toISOString()).toBe("2027-12-31T16:59:00.000Z");
    for (const v of [
      "2027-02-13T09:00",
      "2028-02-29T00:00",
      "2026-12-31T23:59",
      "2027-01-01T00:00",
    ]) {
      expect(formatWaktuWib(parseWaktuWib(v)), v).toBe(v);
    }
  });
  it("menolak format salah dan tanggal tak ada", () => {
    for (const v of [
      "",
      "2027-02-13",
      "2027-02-13 09:00",
      "2027-02-13T9:00",
      "2027-13-01T00:00",
      "2027-02-30T10:00",
      "2027-02-31T10:00",
      "2027-02-13T24:00",
      "2027-02-13T09:60",
      "2027-02-29T10:00",
      "abc",
      "2027-02-13T09:00:00",
      "2027-00-10T10:00",
    ]) {
      expect(parseWaktuWib(v), v).toBeNull();
    }
    expect(parseWaktuWib("2028-02-29T10:00")).not.toBeNull(); // kabisat
  });
  it("formatWaktuWib: null/undefined → kosong", () => {
    expect(formatWaktuWib(null)).toBe("");
    expect(formatWaktuWib(undefined)).toBe("");
  });
});
