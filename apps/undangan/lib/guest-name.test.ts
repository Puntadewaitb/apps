import { describe, expect, it } from "vitest";
import { DEFAULT_GUEST, MAX_GUEST_NAME, guestNameFromParam } from "./guest-name";

describe("guestNameFromParam", () => {
  it("default bila kosong / tidak ada / hanya spasi", () => {
    expect(guestNameFromParam(undefined)).toBe(DEFAULT_GUEST);
    expect(guestNameFromParam("")).toBe(DEFAULT_GUEST);
    expect(guestNameFromParam("   ")).toBe(DEFAULT_GUEST);
    expect(guestNameFromParam([])).toBe(DEFAULT_GUEST);
  });

  it("nama biasa dipertahankan (termasuk unicode & tanda baca umum)", () => {
    expect(guestNameFromParam("Bapak Budi & Keluarga")).toBe("Bapak Budi & Keluarga");
    expect(guestNameFromParam("Dr. Siti Nur’aini, M.Sc.")).toBe("Dr. Siti Nur’aini, M.Sc.");
    expect(guestNameFromParam("Étienne Müller")).toBe("Étienne Müller");
  });

  it("tag HTML dibuang, tidak pernah menghasilkan '<' atau '>'", () => {
    const out = guestNameFromParam("<script>alert(1)</script>Budi");
    expect(out).not.toMatch(/[<>]/);
    expect(out).toContain("Budi");
    expect(guestNameFromParam('"><img src=x onerror=alert(1)>Ani')).not.toMatch(/[<>]/);
  });

  it("karakter kontrol & zero-width dibuang, spasi dirapikan", () => {
    expect(guestNameFromParam("Bu\u0000di​  Santoso\n\t")).toBe("Budi Santoso");
  });

  it("dibatasi panjangnya", () => {
    const out = guestNameFromParam("A".repeat(500));
    expect(out.length).toBe(MAX_GUEST_NAME);
  });

  it("param berulang: ambil yang pertama", () => {
    expect(guestNameFromParam(["Ani", "Budi"])).toBe("Ani");
  });
});
