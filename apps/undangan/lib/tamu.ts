import { phoneIdSchema, randomCode, sanitizeText } from "@tpl/core";

export const MAX_BARIS = 200;
export const MAX_PAX_TAMU = 20;
export const DEFAULT_PAX_TAMU = 2;

export type TamuBaru = { name: string; maxPax: number; phone: string };
export type GalatBaris = { baris: number; pesan: string };

/**
 * Parser daftar tamu (satu per baris): `Nama; jumlah maksimal; no HP`.
 * Hanya nama yang wajib. Nama boleh memuat "&", "dan", gelar, dll. (disanitasi, maks 60 karakter).
 * Hasilnya atomik: bila ada baris yang salah, `valid` tetap diisi tetapi pemanggil sebaiknya
 * menolak seluruh pengiriman agar admin memperbaikinya sekali jalan.
 */
export function parseDaftarTamu(teks: string): { valid: TamuBaru[]; galat: GalatBaris[] } {
  const valid: TamuBaru[] = [];
  const galat: GalatBaris[] = [];
  const baris = teks.split(/\r\n|\r|\n/);

  let terisi = 0;
  baris.forEach((raw, i) => {
    const no = i + 1;
    if (!raw.trim()) return;
    terisi++;
    if (terisi > MAX_BARIS) {
      if (terisi === MAX_BARIS + 1)
        galat.push({ baris: no, pesan: `Maksimal ${MAX_BARIS} tamu per pengiriman` });
      return;
    }
    const [namaRaw = "", paxRaw, hpRaw] = raw.split(";").map((s) => s.trim());
    const name = sanitizeText(namaRaw, { maxLength: 60 });
    if (!name) {
      galat.push({ baris: no, pesan: "Nama kosong" });
      return;
    }
    let maxPax = DEFAULT_PAX_TAMU;
    if (paxRaw) {
      if (!/^\d{1,2}$/.test(paxRaw) || Number(paxRaw) < 1 || Number(paxRaw) > MAX_PAX_TAMU) {
        galat.push({ baris: no, pesan: `Jumlah orang harus 1–${MAX_PAX_TAMU}` });
        return;
      }
      maxPax = Number(paxRaw);
    }
    let phone = "";
    if (hpRaw) {
      const p = phoneIdSchema.safeParse(hpRaw);
      if (!p.success) {
        galat.push({ baris: no, pesan: "Nomor HP tidak valid" });
        return;
      }
      phone = p.data;
    }
    valid.push({ name, maxPax, phone });
  });
  return { valid, galat };
}

/** Kode tamu acak yang mudah dibaca, mis. "K7M2XQ9P" (cocok dengan KODE_RE). */
export function buatKodeTamu(): string {
  return randomCode(8);
}

/** Tautan undangan pribadi. */
export function tautanTamu(base: string, kode: string): string {
  return `${base}/?kode=${encodeURIComponent(kode)}`;
}

/** Tautan WhatsApp berisi pesan undangan + tautan pribadi (ke nomor tamu bila ada). */
export function tautanWhatsApp(opts: {
  phone: string;
  nama: string;
  tautan: string;
  acara: string;
}): string {
  const teks = `Kepada Yth. ${opts.nama},\n\nDengan hormat, kami mengundang Anda ke ${opts.acara}. Detail undangan:\n${opts.tautan}\n\nTerima kasih.`;
  const base = opts.phone ? `https://wa.me/${opts.phone.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(teks)}`;
}
