import { describe, expect, it } from "vitest";
import { formatBulanTahun, formatJam, formatTanggal, hariWib, rupiah } from "./format";

describe("format (WIB, Indonesia)", () => {
  it("tanggal & jam memakai WIB walau mesin berzona lain", () => {
    const d = new Date("2027-02-13T17:30:00Z"); // 14 Feb 00.30 WIB
    expect(formatTanggal(d)).toBe("14 Februari 2027");
    expect(formatJam(d)).toBe("00.30");
    expect(hariWib(d)).toBe("2027-02-14");
    expect(formatBulanTahun(d)).toBe("Februari 2027");
  });
  it("rupiah tanpa desimal", () => {
    expect(rupiah(1_500_000).replace(/\s/g, " ")).toBe("Rp 1.500.000");
    expect(rupiah(0).replace(/\s/g, " ")).toBe("Rp 0");
  });
});
