import { describe, expect, it } from "vitest";
import { amanCallback, can, loginSchema, type Area } from "./auth-core";

describe("can (matriks peran)", () => {
  const SEMUA: Area[] = [
    "ringkasan",
    "berita",
    "agenda",
    "galeri",
    "guru",
    "ppdb",
    "donasi",
    "pengguna",
  ];
  it("ADMIN boleh semua; EDITOR hanya konten; selain itu ditolak", () => {
    for (const a of SEMUA) expect(can("ADMIN", a), a).toBe(true);
    expect(SEMUA.filter((a) => can("EDITOR", a))).toEqual([
      "ringkasan",
      "berita",
      "agenda",
      "galeri",
      "guru",
    ]);
    for (const r of [undefined, "", "admin", "ROOT", "__proto__", "EDITOR "])
      for (const a of SEMUA) expect(can(r, a), `${r}/${a}`).toBe(false);
  });
});

describe("amanCallback (anti open redirect)", () => {
  it("menerima hanya path internal di bawah /admin", () => {
    expect(amanCallback("/admin")).toBe("/admin");
    expect(amanCallback("/admin/berita")).toBe("/admin/berita");
    expect(amanCallback("/admin?x=1")).toBe("/admin?x=1");
    expect(amanCallback("/admin/berita?halaman=2")).toBe("/admin/berita?halaman=2");
  });
  it("menolak semua yang lain → /admin", () => {
    for (const u of [
      undefined,
      null,
      "",
      "/",
      "/berita",
      "/administrator",
      "//evil.example",
      "///evil.example",
      "https://evil.example/admin",
      "http://localhost:3004/admin",
      "javascript:alert(1)",
      "/\\evil.example",
      "\\\\evil.example",
      "/admin/\r\nSet-Cookie: x=1",
      "/admin\u0000",
      "/admin/../..//evil.example".replace("/admin", "admin"),
      "admin",
      "data:text/html,x",
    ]) {
      expect(amanCallback(u as string | null | undefined), String(u)).toBe("/admin");
    }
  });
});

describe("loginSchema", () => {
  it("normalisasi email; batasi panjang", () => {
    expect(loginSchema.parse({ email: "  Admin@Sekolah.Example ", password: "x" }).email).toBe(
      "admin@sekolah.example",
    );
    expect(loginSchema.safeParse({ email: "bukan-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.example", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.example", password: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(
      loginSchema.safeParse({ email: `${"a".repeat(250)}@b.example`, password: "x" }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: ["a@b.example"], password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse(null).success).toBe(false);
  });
});
