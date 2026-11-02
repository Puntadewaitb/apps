import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sekolah } from "../content/sekolah";
import {
  agendas,
  daysFromNow,
  donations,
  galleries,
  posts,
  programs,
  teachers,
  users,
} from "../prisma/seed-data";
import { DONATION_STATUSES, POST_KINDS, ROLES, isOneOf } from "./domain";

const publik = (p: string) => existsSync(join(__dirname, "..", "public", p));
const unik = (a: unknown[]) => new Set(a).size === a.length;
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("data seed demo", () => {
  it("identitas fiktif & tema valid", () => {
    expect(sekolah.kontak.alamat.toLowerCase()).toContain("fiktif");
    expect(sekolah.kontak.email).toMatch(/\.example$/);
    expect(sekolah.kontak.whatsapp).toMatch(/^62\d{8,13}$/);
    expect(["netral", "hangat", "hijau"]).toContain(sekolah.tema);
    expect(sekolah.nav.every((n) => n.href.startsWith("/"))).toBe(true);
  });

  it("user: peran valid, email unik & .example, TANPA password/hash di data", () => {
    expect(unik(users.map((u) => u.email))).toBe(true);
    for (const u of users) {
      expect(isOneOf(ROLES, u.role)).toBe(true);
      expect(u.email).toMatch(/\.example$/);
      expect(Object.keys(u).sort()).toEqual(["email", "name", "role"]);
    }
  });

  it("berita: slug valid & unik, jenis valid, ada draf, terbit ≥ 5, gambar ada", () => {
    expect(unik(posts.map((p) => p.slug))).toBe(true);
    for (const p of posts) {
      expect(p.slug).toMatch(slugRe);
      expect(isOneOf(POST_KINDS, p.kind), p.slug).toBe(true);
      expect(p.excerpt.length).toBeGreaterThan(20);
      expect(p.body.length).toBeGreaterThan(30);
      if (p.image) expect(publik(p.image), p.image).toBe(true);
      if (p.daysAgo !== null) expect(p.daysAgo).toBeGreaterThanOrEqual(0);
    }
    expect(posts.filter((p) => p.daysAgo !== null).length).toBeGreaterThanOrEqual(5);
    expect(posts.some((p) => p.daysAgo === null)).toBe(true); // draf untuk uji "tidak bocor ke publik"
    expect(posts.some((p) => p.kind === "BERITA")).toBe(true);
    expect(posts.some((p) => p.kind === "PENGUMUMAN")).toBe(true);
  });

  it("guru: id & urutan unik, foto ada", () => {
    expect(unik(teachers.map((t) => t.id))).toBe(true);
    expect(unik(teachers.map((t) => t.sort))).toBe(true);
    for (const t of teachers) expect(publik(t.photo), t.photo).toBe(true);
  });

  it("agenda: id unik; berakhir tidak mendahului mulai; semua di masa depan relatif seed", () => {
    expect(unik(agendas.map((a) => a.id))).toBe(true);
    const now = new Date("2026-11-02T10:00:00+07:00");
    for (const a of agendas) {
      const mulai = daysFromNow(now, a.startDay, a.startHour);
      expect(mulai.getTime(), a.title).toBeGreaterThan(now.getTime());
      if (a.endDay !== null) {
        const selesai = daysFromNow(now, a.endDay, a.endHour ?? 23);
        expect(selesai >= mulai, a.title).toBe(true);
      }
    }
  });

  it("daysFromNow: jam dinding WIB benar & tidak bergeser oleh zona waktu mesin", () => {
    const now = new Date("2026-11-02T22:30:00Z"); // = 03 Nov 05:30 WIB
    expect(daysFromNow(now, 0, 8).toISOString()).toBe("2026-11-03T01:00:00.000Z"); // 03 Nov 08:00 WIB
    expect(daysFromNow(now, 2, 23, 59).toISOString()).toBe("2026-11-05T16:59:00.000Z");
    expect(daysFromNow(now, -3, 0).toISOString()).toBe("2026-10-30T17:00:00.000Z"); // 31 Okt 00:00 WIB
  });

  it("galeri: slug unik, cover & gambar ada, cover termasuk gambar album", () => {
    expect(unik(galleries.map((g) => g.slug))).toBe(true);
    for (const g of galleries) {
      expect(g.slug).toMatch(slugRe);
      expect(g.images.length).toBeGreaterThan(0);
      expect(g.images.map((i) => i.src)).toContain(g.cover);
      for (const i of g.images) expect(publik(i.src), i.src).toBe(true);
    }
  });

  it("donasi: program valid; donasi merujuk program yang ada, status valid, nominal bulat > 0", () => {
    expect(unik(programs.map((p) => p.slug))).toBe(true);
    for (const p of programs) {
      expect(Number.isInteger(p.target) && p.target > 0).toBe(true);
      expect(publik(p.image)).toBe(true);
    }
    const slugs = new Set(programs.map((p) => p.slug));
    for (const d of donations) {
      expect(slugs.has(d.program), d.program).toBe(true);
      expect(isOneOf(DONATION_STATUSES, d.status)).toBe(true);
      expect(Number.isInteger(d.amount) && d.amount > 0).toBe(true);
    }
    // contoh semua status ada & tidak ada program yang melebihi target dengan donasi terverifikasi
    for (const s of DONATION_STATUSES)
      expect(
        donations.some((d) => d.status === s),
        s,
      ).toBe(true);
    for (const p of programs) {
      const total = donations
        .filter((d) => d.program === p.slug && d.status === "TERVERIFIKASI")
        .reduce((a, d) => a + d.amount, 0);
      expect(total, p.slug).toBeLessThan(p.target);
    }
  });
});
