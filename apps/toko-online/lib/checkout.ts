/**
 * Logika checkout MURNI (tanpa DB/DOM): ongkir, voucher, total, pesan WhatsApp.
 * Dipakai server untuk menghitung ULANG semua angka dari data DB — angka dari klien tidak pernah dipercaya.
 */
import { buildWhatsAppUrl } from "@tpl/ui";
import type { Ongkir } from "./setting";
import { rupiah } from "./format";

/** Batas total pesanan (Prisma `Int` = 32-bit; juga pagar waras terhadap harga/qty ekstrem). */
export const MAKS_TOTAL = 1_000_000_000;

/** Kunci pencarian tarif kota: huruf kecil, spasi dirapikan, awalan "Kota/Kab./Kabupaten" dibuang. */
export function kunciKota(kota: string): string {
  return kota
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:kota|kab\.?|kabupaten)\s+/, "");
}

/** Tarif kota dari tabel manual; kota tidak terdaftar → tarif bawaan. Hanya kunci milik sendiri (bukan prototipe). */
export function hitungOngkir(kota: string, o: Ongkir): number {
  const k = kunciKota(kota);
  return Object.hasOwn(o.kota, k) ? o.kota[k]! : o.bawaan;
}

/** Kode voucher: huruf besar, hanya A–Z 0–9 _ -, maks. 32; selain itu "" (tidak ada voucher). */
export function normalisasiKode(input: string | undefined | null): string {
  const k = (input ?? "").trim().toUpperCase();
  return /^[A-Z0-9_-]{1,32}$/.test(k) ? k : "";
}

export type VoucherRow = {
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  quota: number | null;
  used: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

export type AlasanVoucher =
  "tidak-ada" | "nonaktif" | "belum-mulai" | "kedaluwarsa" | "habis" | "minimal" | "tidak-valid";

export type HasilDiskon =
  { ok: true; diskon: number } | { ok: false; alasan: AlasanVoucher; minSubtotal?: number };

/**
 * Hitung diskon. Diskon berlaku atas SUBTOTAL barang (bukan ongkir) dan tidak pernah melebihi subtotal.
 * PERSEN dibulatkan ke bawah dan dibatasi `maxDiscount`; NOMINAL = nilai tetap.
 */
export function hitungDiskon(
  v: VoucherRow | null | undefined,
  subtotal: number,
  now: Date,
): HasilDiskon {
  if (!v) return { ok: false, alasan: "tidak-ada" };
  if (!v.active) return { ok: false, alasan: "nonaktif" };
  if (v.startsAt && now.getTime() < v.startsAt.getTime())
    return { ok: false, alasan: "belum-mulai" };
  if (v.endsAt && now.getTime() > v.endsAt.getTime()) return { ok: false, alasan: "kedaluwarsa" };
  if (v.quota !== null && v.used >= v.quota) return { ok: false, alasan: "habis" };
  if (subtotal < v.minSubtotal) return { ok: false, alasan: "minimal", minSubtotal: v.minSubtotal };
  let diskon: number;
  if (v.type === "PERSEN") {
    if (!Number.isInteger(v.value) || v.value < 1 || v.value > 100)
      return { ok: false, alasan: "tidak-valid" };
    diskon = Math.floor((subtotal * v.value) / 100);
    if (v.maxDiscount !== null) diskon = Math.min(diskon, Math.max(0, v.maxDiscount));
  } else if (v.type === "NOMINAL") {
    if (!Number.isInteger(v.value) || v.value < 1) return { ok: false, alasan: "tidak-valid" };
    diskon = v.value;
  } else return { ok: false, alasan: "tidak-valid" };
  return { ok: true, diskon: Math.max(0, Math.min(diskon, subtotal)) };
}

/** Pesan untuk pembeli. Sengaja generik untuk kode yang tidak ada/nonaktif/kedaluwarsa (tidak membocorkan status kode). */
export function pesanVoucher(alasan: AlasanVoucher, minSubtotal?: number): string {
  if (alasan === "minimal")
    return `Voucher berlaku untuk belanja minimal ${rupiah(minSubtotal ?? 0)}.`;
  if (alasan === "habis") return "Kuota voucher ini sudah habis.";
  return "Kode voucher tidak valid atau tidak dapat dipakai.";
}

export const hitungTotal = (subtotal: number, ongkir: number, diskon: number) =>
  subtotal + ongkir - diskon;

export type DataWhatsApp = {
  toko: string;
  whatsapp: string;
  kode: string;
  nama: string;
  alamat: string;
  kota: string;
  baris: Array<{ produkNama: string; varianNama: string; qty: number; jumlah: number }>;
  subtotal: number;
  ongkir: number;
  diskon: number;
  voucher: string;
  total: number;
  catatan: string;
  rekening: Array<{ bank: string; nomor: string; atasNama: string }>;
};

/** Ringkasan pesanan untuk WhatsApp. Panjang dibatasi agar URL wa.me tidak melewati batas. */
export function pesanWhatsApp(d: DataWhatsApp): string {
  const maks = 12;
  const item = d.baris.slice(0, maks).map((b, i) => {
    const varian = b.varianNama && b.varianNama !== "Standar" ? ` (${b.varianNama})` : "";
    return `${i + 1}. ${b.produkNama}${varian} × ${b.qty} = ${rupiah(b.jumlah)}`;
  });
  if (d.baris.length > maks) item.push(`… dan ${d.baris.length - maks} item lainnya`);
  const rek = d.rekening.slice(0, 3).map((r) => `- ${r.bank} ${r.nomor} a.n. ${r.atasNama}`);
  const teks = [
    `Halo ${d.toko}, saya sudah membuat pesanan.`,
    `Kode pesanan: ${d.kode}`,
    `Nama: ${d.nama}`,
    "",
    "Pesanan:",
    ...item,
    "",
    `Subtotal: ${rupiah(d.subtotal)}`,
    `Ongkir (${d.kota}): ${rupiah(d.ongkir)}`,
    ...(d.diskon > 0 ? [`Diskon${d.voucher ? ` (${d.voucher})` : ""}: -${rupiah(d.diskon)}`] : []),
    `TOTAL: ${rupiah(d.total)}`,
    "",
    `Alamat: ${d.alamat}`,
    ...(d.catatan ? [`Catatan: ${d.catatan}`] : []),
    ...(rek.length ? ["", "Pembayaran via transfer:", ...rek] : []),
    "",
    "Mohon konfirmasi pesanan saya. Terima kasih!",
  ].join("\n");
  return teks.length > 1600 ? `${teks.slice(0, 1597)}…` : teks;
}

export function urlWhatsApp(d: DataWhatsApp): string {
  return d.whatsapp ? buildWhatsAppUrl(d.whatsapp, pesanWhatsApp(d)) : "";
}
