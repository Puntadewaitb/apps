import { describe, expect, it } from "vitest";
import {
  effectivePax,
  looksLikeSpam,
  moderationEnabled,
  rsvpSchema,
  wishSchema,
  wishVisibility,
} from "./schemas";

describe("rsvpSchema", () => {
  it("valid: menormalkan nama & pax string → angka", () => {
    const r = rsvpSchema.parse({
      name: "  Budi  Santoso ",
      status: "HADIR",
      pax: "3",
      kode: "DEMO-0001",
    });
    expect(r).toEqual({ name: "Budi Santoso", status: "HADIR", pax: 3, kode: "DEMO-0001" });
  });
  it("pax default 1, kode kosong → undefined", () => {
    const r = rsvpSchema.parse({ name: "Ani", status: "RAGU", kode: "" });
    expect(r.pax).toBe(1);
    expect(r.kode).toBeUndefined();
  });
  it("menolak status/pax/kode/nama tidak valid dengan pesan jelas", () => {
    const bad = rsvpSchema.safeParse({ name: "A", status: "MUNGKIN", pax: -1, kode: "x y" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const paths = bad.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["name", "status", "pax", "kode"]));
    }
    expect(rsvpSchema.safeParse({ name: "Ani", status: "HADIR", pax: 1.5 }).success).toBe(false);
    expect(rsvpSchema.safeParse({ name: "Ani", status: "HADIR", pax: 999 }).success).toBe(false);
    expect(rsvpSchema.safeParse({ name: "Ani", status: "HADIR", pax: "abc" }).success).toBe(false);
  });
});

describe("wishSchema", () => {
  it("menyanitasi pesan (tag dibuang) & membatasi panjang", () => {
    expect(wishSchema.parse({ name: "Ani", message: "Selamat <b>ya</b>!" }).message).toBe(
      "Selamat ya!",
    );
    expect(wishSchema.safeParse({ name: "Ani", message: "ok" }).success).toBe(false); // < 3
    expect(wishSchema.safeParse({ name: "Ani", message: "x".repeat(501) }).success).toBe(false);
  });
});

describe("effectivePax", () => {
  it("tidak hadir → 0; hadir minimal 1; dibatasi maxPax", () => {
    expect(effectivePax("TIDAK_HADIR", 4, 5)).toBe(0);
    expect(effectivePax("HADIR", 0, 5)).toBe(1);
    expect(effectivePax("HADIR", 9, 2)).toBe(2);
    expect(effectivePax("RAGU", 3, 5)).toBe(3);
  });
});

describe("moderasi", () => {
  it("looksLikeSpam: tautan & domain", () => {
    for (const s of [
      "cek https://x.id",
      "kunjungi www.promo.co",
      "judi online slot88.com",
      "wa.me/62812 bagus.xyz",
    ]) {
      expect(looksLikeSpam(s), s).toBe(true);
    }
    for (const s of [
      "Selamat menempuh hidup baru!",
      "Semoga sakinah, mawaddah, warahmah.",
      "Sampai ketemu jam 10.30 ya",
    ]) {
      expect(looksLikeSpam(s), s).toBe(false);
    }
  });
  it("wishVisibility: tampil hanya bila moderasi mati & bukan spam", () => {
    expect(wishVisibility("Selamat ya", false)).toBe(true);
    expect(wishVisibility("Selamat ya", true)).toBe(false);
    expect(wishVisibility("lihat www.spam.com", false)).toBe(false);
  });
  it("moderationEnabled dari env", () => {
    expect(moderationEnabled({ WISH_MODERATION: "on" })).toBe(true);
    expect(moderationEnabled({ WISH_MODERATION: "ON" })).toBe(true);
    expect(moderationEnabled({})).toBe(false);
    expect(moderationEnabled({ WISH_MODERATION: "off" })).toBe(false);
  });
});
