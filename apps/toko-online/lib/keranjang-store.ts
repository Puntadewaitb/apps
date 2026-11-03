"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  KUNCI_KERANJANG,
  hapus as hapusBaris,
  parseKeranjang,
  serialisasi,
  tambah as tambahBaris,
  ubahQty as ubahBaris,
  type Baris,
  type DetailBaris,
  type HasilTambah,
} from "./keranjang";

const KOSONG: Baris[] = [];
const EVENT = "toko:keranjang";
let cache: { raw: string | null; baris: Baris[] } = { raw: null, baris: KOSONG };
/** Cadangan bila localStorage tidak tersedia (mode privat/diblokir): keranjang tetap jalan selama tab terbuka. */
let memori: string | null = null;

function bacaRaw(): string | null {
  try {
    return window.localStorage.getItem(KUNCI_KERANJANG) ?? memori;
  } catch {
    return memori;
  }
}

function snapshot(): Baris[] {
  const raw = bacaRaw();
  if (raw === cache.raw) return cache.baris; // referensi stabil → tidak render ulang tanpa perubahan
  cache = { raw, baris: raw ? parseKeranjang(raw) : KOSONG };
  return cache.baris;
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KUNCI_KERANJANG) cb();
  };
  window.addEventListener("storage", onStorage); // antar-tab
  window.addEventListener(EVENT, cb); // tab yang sama
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
}

function tulis(b: Baris[]) {
  const raw = b.length ? serialisasi(b) : null;
  memori = raw;
  try {
    if (raw) window.localStorage.setItem(KUNCI_KERANJANG, raw);
    else window.localStorage.removeItem(KUNCI_KERANJANG);
  } catch {
    /* penyimpanan penuh/diblokir → tetap di memori */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Aksi di luar komponen React — selalu membaca keadaan TERBARU dari penyimpanan. */
export const keranjang = {
  baca: () => snapshot(),
  tambah(varianId: number, qty: number, stok?: number): HasilTambah {
    const h = tambahBaris(snapshot(), varianId, qty, stok);
    if (h.ditambah > 0) tulis(h.baris);
    return h;
  },
  ubahQty(varianId: number, qty: number, stok?: number) {
    tulis(ubahBaris(snapshot(), varianId, qty, stok));
  },
  hapus(varianId: number) {
    tulis(hapusBaris(snapshot(), varianId));
  },
  kosongkan() {
    tulis([]);
  },
};

/** Isi keranjang (reaktif). Di server & render hidrasi pertama: kosong → tidak ada ketidakcocokan HTML. */
export function useKeranjang(): Baris[] {
  return useSyncExternalStore(subscribe, snapshot, () => KOSONG);
}

const subscribeNoop = () => () => {};
/** true setelah hidrasi di klien (untuk membedakan "belum dibaca" dari "memang kosong"). */
export function useSiap(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export type StatusDetail = "memuat" | "siap" | "galat";

/**
 * Ambil detail terkini (nama/harga/stok) dari server untuk ID varian yang ada di keranjang.
 * Hanya dipicu ulang saat DAFTAR ID berubah (ubah jumlah tidak memanggil server).
 */
export function useDetail(ids: number[], aktif = true) {
  const kunci = [...ids].sort((a, b) => a - b).join(",");
  const [hasil, setHasil] = useState<{
    kunci: string;
    detail: Map<number, DetailBaris> | null;
    galat: boolean;
  }>({
    kunci: "",
    detail: null,
    galat: false,
  });
  const [ulang, setUlang] = useState(0);
  useEffect(() => {
    if (!aktif || kunci === "") return;
    const ac = new AbortController();
    fetch("/api/keranjang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: kunci.split(",").map(Number) }),
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { items: DetailBaris[] }) =>
        setHasil({ kunci, detail: new Map(j.items.map((d) => [d.varianId, d])), galat: false }),
      )
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError")
          setHasil({ kunci, detail: null, galat: true });
      });
    return () => ac.abort();
  }, [kunci, aktif, ulang]);
  const status: StatusDetail =
    kunci === "" ? "siap" : hasil.kunci !== kunci ? "memuat" : hasil.galat ? "galat" : "siap";
  const detail =
    kunci !== "" && hasil.kunci === kunci && hasil.detail
      ? hasil.detail
      : new Map<number, DetailBaris>();
  return { detail, status, muatUlang: () => setUlang((n) => n + 1) };
}
