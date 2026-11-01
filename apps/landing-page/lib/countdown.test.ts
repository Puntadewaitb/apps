import { describe, expect, it } from "vitest";
import { pad, remaining } from "./countdown";

describe("remaining", () => {
  const end = Date.parse("2026-12-31T23:59:59+07:00");

  it("menghitung hari/jam/menit/detik", () => {
    const now = end - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    expect(remaining(end, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("membulatkan ke bawah detik", () => {
    expect(remaining(end, end - 1500)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  it("null bila sudah lewat, tepat waktu, atau input tidak valid", () => {
    expect(remaining(end, end)).toBeNull();
    expect(remaining(end, end + 1)).toBeNull();
    expect(remaining(Number.NaN, 0)).toBeNull();
    expect(remaining(end, Number.NaN)).toBeNull();
  });

  it("pad dua digit", () => {
    expect(pad(5)).toBe("05");
    expect(pad(12)).toBe("12");
  });
});
