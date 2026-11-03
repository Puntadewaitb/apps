/**
 * Logika keranjang MURNI (tanpa DOM/DB) agar mudah diuji. Keranjang hanya menyimpan ID varian + jumlah.
 * Harga, nama, dan stok TIDAK pernah disimpan di klien: selalu diambil dari server (POST /api/keranjang),
 * dan dihitung ULANG oleh server saat checkout (T4). Isi localStorage dianggap input tidak tepercaya.
 */
export const KUNCI_KERANJANG = "toko.keranjang.v1";
export const MAKS_BARIS = 50;
export const MAKS_QTY = 99;

export type Baris = { varianId: number; qty: number };

const ID_MAKS = 2_147_483_647;
const idSah = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n > 0 && n <= ID_MAKS;
const qtySah = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n > 0;

/** Baca isi penyimpanan secara defensif: JSON rusak/tipe salah → []; duplikat digabung; qty dijepit; baris dibatasi. */
export function parseKeranjang(json: string | null | undefined): Baris[] {
  if (!json || json.length > 20_000) return [];
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const peta = new Map<number, number>();
  for (const x of data) {
    if (!x || typeof x !== "object") continue;
    const { varianId, qty } = x as Record<string, unknown>;
    if (!idSah(varianId) || !qtySah(qty)) continue;
    if (!peta.has(varianId) && peta.size >= MAKS_BARIS) continue;
    peta.set(varianId, Math.min(MAKS_QTY, (peta.get(varianId) ?? 0) + qty));
  }
  return [...peta].map(([varianId, qty]) => ({ varianId, qty }));
}

export const serialisasi = (b: Baris[]) =>
  JSON.stringify(b.map(({ varianId, qty }) => ({ varianId, qty })));

export type HasilTambah = {
  baris: Baris[];
  qtyAkhir: number;
  terpotong: boolean;
  ditambah: number;
};

/**
 * Tambah `qty` ke varian. Jumlah akhir dijepit ke min(stok, MAKS_QTY) bila `stok` diketahui.
 * `terpotong` = permintaan melebihi batas; `ditambah` = selisih yang benar-benar masuk.
 */
export function tambah(b: Baris[], varianId: number, qty: number, stok?: number): HasilTambah {
  const ada = b.find((x) => x.varianId === varianId);
  const sebelum = ada?.qty ?? 0;
  const batas = Math.max(0, Math.min(MAKS_QTY, stok ?? MAKS_QTY));
  const diminta = sebelum + Math.max(0, Math.trunc(qty) || 0);
  const qtyAkhir = Math.min(diminta, batas);
  const terpotong = qtyAkhir < diminta;
  if (!ada && b.length >= MAKS_BARIS)
    return { baris: b, qtyAkhir: 0, terpotong: true, ditambah: 0 };
  if (qtyAkhir <= sebelum) return { baris: b, qtyAkhir: sebelum, terpotong, ditambah: 0 };
  const baris = ada
    ? b.map((x) => (x.varianId === varianId ? { ...x, qty: qtyAkhir } : x))
    : [...b, { varianId, qty: qtyAkhir }];
  return { baris, qtyAkhir, terpotong, ditambah: qtyAkhir - sebelum };
}

/** Set jumlah mutlak (dijepit 1..min(stok, MAKS_QTY)). Varian yang tidak ada di keranjang tidak ditambahkan. */
export function ubahQty(b: Baris[], varianId: number, qty: number, stok?: number): Baris[] {
  const batas = Math.max(1, Math.min(MAKS_QTY, stok ?? MAKS_QTY));
  const q = Math.min(batas, Math.max(1, Math.trunc(qty) || 1));
  return b.map((x) => (x.varianId === varianId ? { ...x, qty: q } : x));
}

export const hapus = (b: Baris[], varianId: number) => b.filter((x) => x.varianId !== varianId);
export const jumlahItem = (b: Baris[]) => b.reduce((a, x) => a + x.qty, 0);

/** Jumlah yang berlaku untuk dihitung: tidak melebihi stok (server) maupun batas per-baris. */
export const qtyEfektif = (qty: number, stok: number) => Math.max(0, Math.min(qty, stok, MAKS_QTY));

export type DetailBaris =
  | { varianId: number; tersedia: false }
  | {
      varianId: number;
      tersedia: true;
      produkNama: string;
      slug: string;
      varianNama: string;
      gambar: string;
      harga: number;
      stok: number;
    };

/** Subtotal dari data server. Baris tak tersedia/habis tidak dihitung. */
export function hitungSubtotal(
  b: Baris[],
  detail: Map<number, DetailBaris>,
): { subtotal: number; item: number } {
  let subtotal = 0;
  let item = 0;
  for (const x of b) {
    const d = detail.get(x.varianId);
    if (!d || !d.tersedia) continue;
    const q = qtyEfektif(x.qty, d.stok);
    subtotal += d.harga * q;
    item += q;
  }
  return { subtotal, item };
}
