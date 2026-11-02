import { describe, expect, it } from "vitest";
import { formatJam, formatTanggal } from "./format";

describe("format tanggal & jam (WIB)", () => {
  const akad = new Date("2027-02-20T08:00:00+07:00");

  it("tanggal Indonesia lengkap dengan hari", () => {
    expect(formatTanggal(akad)).toBe("Sabtu, 20 Februari 2027");
  });

  it("jam memakai titik dan akhiran WIB", () => {
    expect(formatJam(akad)).toBe("08.00 WIB");
    expect(formatJam(new Date("2027-02-20T13:30:00+07:00"))).toBe("13.30 WIB");
  });

  it("tidak bergantung zona waktu mesin: 17:00 UTC = 00.00 WIB hari berikutnya", () => {
    const d = new Date("2027-02-20T17:00:00Z");
    expect(formatJam(d)).toBe("00.00 WIB");
    expect(formatTanggal(d)).toBe("Minggu, 21 Februari 2027");
  });
});
