import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profilSchema, programSchema } from "../lib/konten-schema";
import { profil } from "./profil";
import { program } from "./program";
import { sekolah } from "./sekolah";

const publik = (p: string) => existsSync(join(__dirname, "..", "public", p));

describe("konten statis", () => {
  it("profil & program lolos skema", () => {
    const a = profilSchema.safeParse(profil);
    expect(a.success, a.success ? "" : JSON.stringify(a.error.issues, null, 1)).toBe(true);
    const b = programSchema.safeParse(program);
    expect(b.success, b.success ? "" : JSON.stringify(b.error.issues, null, 1)).toBe(true);
  });

  it("skema menolak kategori ekstrakurikuler tak dikenal, id ganda, dan gambar di luar /img", () => {
    const k1 = structuredClone(program);
    k1.ekstrakurikuler.daftar[0]!.kategori = "tidak-ada";
    expect(programSchema.safeParse(k1).success).toBe(false);
    const k2 = structuredClone(program);
    k2.akademik.daftar[1]!.id = k2.akademik.daftar[0]!.id;
    expect(programSchema.safeParse(k2).success).toBe(false);
    const p = structuredClone(profil);
    p.sambutan.foto = "https://evil.example/x.svg";
    expect(profilSchema.safeParse(p).success).toBe(false);
  });

  it("foto sambutan ada; setiap kategori ekskul punya ≥ 1 kegiatan", () => {
    expect(publik(profil.sambutan.foto)).toBe(true);
    for (const k of program.ekstrakurikuler.kategori)
      expect(
        program.ekstrakurikuler.daftar.some((e) => e.kategori === k.id),
        k.id,
      ).toBe(true);
  });

  it("navigasi: path unik & internal", () => {
    const h = sekolah.nav.map((n) => n.href);
    expect(new Set(h).size).toBe(h.length);
    expect(h.every((x) => x.startsWith("/"))).toBe(true);
  });
});
