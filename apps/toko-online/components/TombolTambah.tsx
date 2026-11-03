"use client";

import { useState } from "react";
import { Button } from "@tpl/ui";
import { MAKS_QTY } from "../lib/keranjang";
import { keranjang } from "../lib/keranjang-store";

type Pesan = { jenis: "ok" | "info" | "galat"; teks: string };

/** Pilih jumlah + "Tambah ke keranjang". Stok di sini hanya petunjuk UI; server menghitung ulang saat checkout. */
export function TombolTambah({
  varianId,
  stok,
  nama,
}: {
  varianId: number;
  stok: number;
  nama: string;
}) {
  const [qty, setQty] = useState("1");
  const [pesan, setPesan] = useState<Pesan | null>(null);
  const maks = Math.max(0, Math.min(stok, MAKS_QTY));
  const habis = maks <= 0;
  const angka = Math.min(maks, Math.max(1, Math.trunc(Number(qty)) || 1));

  function tambah() {
    const h = keranjang.tambah(varianId, angka, maks);
    if (h.ditambah > 0)
      setPesan({
        jenis: h.terpotong ? "info" : "ok",
        teks: h.terpotong
          ? `Ditambahkan, tetapi jumlah dibatasi stok: ${h.qtyAkhir} di keranjang.`
          : `${h.ditambah} × ${nama} ditambahkan ke keranjang.`,
      });
    else if (h.terpotong)
      setPesan({
        jenis: "galat",
        teks: `Jumlah di keranjang sudah mencapai stok (${h.qtyAkhir}).`,
      });
    else setPesan({ jenis: "galat", teks: "Tidak bisa menambahkan ke keranjang." });
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="jumlah-beli" className="block text-sm font-medium text-fg">
            Jumlah
          </label>
          <div className="mt-1 flex items-center">
            <button
              type="button"
              aria-label="Kurangi jumlah"
              disabled={habis || angka <= 1}
              onClick={() => setQty(String(angka - 1))}
              className="min-h-11 min-w-11 rounded-l-md border border-border text-lg disabled:opacity-40"
            >
              −
            </button>
            <input
              id="jumlah-beli"
              type="number"
              inputMode="numeric"
              min={1}
              max={maks || 1}
              value={qty}
              disabled={habis}
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => setQty(String(angka))}
              className="min-h-11 w-16 border-y border-border bg-bg text-center text-fg"
            />
            <button
              type="button"
              aria-label="Tambah jumlah"
              disabled={habis || angka >= maks}
              onClick={() => setQty(String(angka + 1))}
              className="min-h-11 min-w-11 rounded-r-md border border-border text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <Button size="lg" onClick={tambah} disabled={habis} data-testid="tambah-keranjang">
          {habis ? "Stok habis" : "Tambah ke keranjang"}
        </Button>
      </div>
      <p
        role="status"
        data-testid="pesan-keranjang"
        className={`mt-3 text-sm ${pesan?.jenis === "galat" ? "text-danger" : "text-fg"}`}
      >
        {pesan && (
          <>
            {pesan.teks}{" "}
            {pesan.jenis !== "galat" && (
              <a href="/keranjang" className="font-medium text-primary underline">
                Lihat keranjang
              </a>
            )}
          </>
        )}
      </p>
    </div>
  );
}
