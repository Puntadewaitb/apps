import { cache } from "react";
import { db } from "./db";

export type Rekening = { bank: string; nomor: string; atasNama: string };
export type Ongkir = { bawaan: number; kota: Record<string, number> };

export type PengaturanToko = {
  nama: string;
  tagline: string;
  whatsapp: string;
  alamat: string;
  rekening: Rekening[];
  catatanBayar: string;
  ongkir: Ongkir;
};

export const BAWAAN: PengaturanToko = {
  nama: "Toko Online",
  tagline: "",
  whatsapp: "",
  alamat: "",
  rekening: [],
  catatanBayar: "",
  ongkir: { bawaan: 0, kota: {} },
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Parse rekening dari JSON; entri berbentuk salah dibuang, JSON rusak → []. */
export function parseRekening(json: string | undefined): Rekening[] {
  try {
    const a: unknown = JSON.parse(json ?? "[]");
    if (!Array.isArray(a)) return [];
    return a
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        bank: str(x.bank, 60),
        nomor: str(x.nomor, 40),
        atasNama: str(x.atasNama, 80),
      }))
      .filter((r) => r.bank && r.nomor && r.atasNama);
  } catch {
    return [];
  }
}

/** Parse tabel ongkir; nilai bukan bilangan bulat ≥ 0 dibuang; kunci kota dinormalkan huruf kecil. */
export function parseOngkir(json: string | undefined): Ongkir {
  const ok = (n: unknown): n is number =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 10_000_000;
  try {
    const o: unknown = JSON.parse(json ?? "{}");
    if (!o || typeof o !== "object") return { bawaan: 0, kota: {} };
    const { bawaan, kota } = o as { bawaan?: unknown; kota?: unknown };
    const peta: Record<string, number> = {};
    if (kota && typeof kota === "object")
      for (const [k, v] of Object.entries(kota as Record<string, unknown>)) {
        const key = k.trim().toLowerCase();
        if (key && key.length <= 60 && ok(v)) peta[key] = v;
      }
    return { bawaan: ok(bawaan) ? bawaan : 0, kota: peta };
  } catch {
    return { bawaan: 0, kota: {} };
  }
}

export function dariBaris(rows: Array<{ key: string; value: string }>): PengaturanToko {
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return {
    nama: str(m.get("toko.nama"), 80) || BAWAAN.nama,
    tagline: str(m.get("toko.tagline"), 200),
    whatsapp: /^62\d{8,13}$/.test(m.get("toko.whatsapp") ?? "") ? m.get("toko.whatsapp")! : "",
    alamat: str(m.get("toko.alamat"), 300),
    rekening: parseRekening(m.get("toko.rekening")),
    catatanBayar: str(m.get("toko.catatanBayar"), 300),
    ongkir: parseOngkir(m.get("toko.ongkir")),
  };
}

/** Pengaturan toko dari DB (di-cache selama satu request). Data rusak → nilai bawaan aman, bukan error. */
export const getPengaturan = cache(async (): Promise<PengaturanToko> =>
  dariBaris(await db().setting.findMany()),
);
