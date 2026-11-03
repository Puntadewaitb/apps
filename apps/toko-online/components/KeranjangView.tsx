"use client";

import { useEffect, useState } from "react";
import { Badge, ButtonLink } from "@tpl/ui";
import { rupiah } from "../lib/format";
import {
  MAKS_QTY,
  hitungSubtotal,
  qtyEfektif,
  type Baris,
  type DetailBaris,
} from "../lib/keranjang";
import { keranjang, useDetail, useKeranjang, useSiap } from "../lib/keranjang-store";

function Qty({
  nama,
  qty,
  maks,
  onUbah,
}: {
  nama: string;
  qty: number;
  maks: number;
  onUbah: (n: number) => void;
}) {
  const [draf, setDraf] = useState(String(qty));
  const [terakhir, setTerakhir] = useState(qty);
  // Sinkron saat qty berubah dari luar (tombol +/−, tab lain, penyesuaian stok) — penyesuaian state saat render.
  if (terakhir !== qty) {
    setTerakhir(qty);
    setDraf(String(qty));
  }
  const komit = () => {
    const n = Math.min(maks, Math.max(1, Math.trunc(Number(draf)) || 1));
    setDraf(String(n));
    if (n !== qty) onUbah(n);
  };
  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label={`Kurangi jumlah ${nama}`}
        disabled={qty <= 1}
        onClick={() => onUbah(qty - 1)}
        className="min-h-11 min-w-11 rounded-l-md border border-border text-lg disabled:opacity-40"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Jumlah ${nama}`}
        min={1}
        max={maks}
        value={draf}
        onChange={(e) => setDraf(e.target.value)}
        onBlur={komit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            komit();
          }
        }}
        className="min-h-11 w-16 border-y border-border bg-bg text-center text-fg"
      />
      <button
        type="button"
        aria-label={`Tambah jumlah ${nama}`}
        disabled={qty >= maks}
        onClick={() => onUbah(qty + 1)}
        className="min-h-11 min-w-11 rounded-r-md border border-border text-lg disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function BarisKeranjang({ b, d }: { b: Baris; d: DetailBaris | undefined }) {
  if (!d || !d.tersedia)
    return (
      <li
        className="flex flex-wrap items-center justify-between gap-3 p-4"
        data-testid="baris-keranjang"
        data-status="tidak-tersedia"
      >
        <p className="text-muted">
          <Badge tone="danger">Tidak tersedia</Badge> Produk ini sudah tidak dijual dan tidak ikut
          dihitung.
        </p>
        <button
          type="button"
          onClick={() => keranjang.hapus(b.varianId)}
          className="text-sm text-danger underline"
        >
          Hapus dari keranjang
        </button>
      </li>
    );
  const maks = Math.min(d.stok, MAKS_QTY);
  const habis = d.stok <= 0;
  const q = qtyEfektif(b.qty, d.stok);
  const nama = `${d.produkNama} (${d.varianNama})`;
  return (
    <li
      className="grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto]"
      data-testid="baris-keranjang"
      data-status={habis ? "habis" : "ok"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={d.gambar}
        alt=""
        width={96}
        height={96}
        className="h-24 w-24 rounded-md border border-border"
      />
      <div className="min-w-0">
        <h2 className="font-semibold text-fg">
          <a href={`/produk/${d.slug}`} className="hover:underline">
            {d.produkNama}
          </a>
        </h2>
        <p className="text-sm text-muted">Varian: {d.varianNama}</p>
        <p className="mt-1 text-sm text-fg" data-testid="harga-satuan">
          {rupiah(d.harga)}
        </p>
        {habis ? (
          <p className="mt-2 text-sm text-danger" role="status">
            Stok habis — tidak ikut dihitung.
          </p>
        ) : (
          <>
            <div className="mt-3">
              <Qty
                nama={nama}
                qty={q}
                maks={maks}
                onUbah={(n) => keranjang.ubahQty(b.varianId, n, d.stok)}
              />
            </div>
            {b.qty > q && (
              <p className="mt-2 text-sm text-danger" role="status">
                Stok tersisa {d.stok}; jumlah disesuaikan.
              </p>
            )}
          </>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-bold text-fg" data-testid="subtotal-baris">
          {habis ? "—" : rupiah(d.harga * q)}
        </p>
        <button
          type="button"
          onClick={() => keranjang.hapus(b.varianId)}
          aria-label={`Hapus ${nama} dari keranjang`}
          className="min-h-11 text-sm text-danger underline"
        >
          Hapus
        </button>
      </div>
    </li>
  );
}

export function KeranjangView() {
  const baris = useKeranjang();
  const siap = useSiap();
  const { detail, status, muatUlang } = useDetail(baris.map((b) => b.varianId));

  // Rapikan penyimpanan: jumlah yang melebihi stok (menurut server) dijepit sekali, supaya konsisten di semua halaman.
  useEffect(() => {
    if (status !== "siap") return;
    for (const b of baris) {
      const d = detail.get(b.varianId);
      if (d?.tersedia && d.stok > 0 && b.qty > d.stok)
        keranjang.ubahQty(b.varianId, d.stok, d.stok);
    }
  }, [baris, detail, status]);

  if (!siap)
    return (
      <p className="text-muted" role="status">
        Memuat keranjang…
      </p>
    );
  if (baris.length === 0)
    return (
      <div
        className="rounded-lg border border-dashed border-border p-10 text-center"
        data-testid="keranjang-kosong"
      >
        <p className="font-medium text-fg">Keranjang Anda masih kosong</p>
        <p className="mt-1 text-muted">Yuk, pilih produk favorit Anda.</p>
        <ButtonLink href="/produk" className="mt-5">
          Mulai belanja
        </ButtonLink>
      </div>
    );
  if (status === "memuat")
    return (
      <p className="text-muted" role="status">
        Memuat harga & stok terbaru…
      </p>
    );
  if (status === "galat")
    return (
      <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4">
        <p className="text-danger">Gagal memuat keranjang. Periksa koneksi Anda.</p>
        <button type="button" onClick={muatUlang} className="mt-2 text-sm underline">
          Coba lagi
        </button>
      </div>
    );

  const { subtotal, item } = hitungSubtotal(baris, detail);
  const bisaCheckout = item > 0;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul
        className="divide-y divide-border rounded-lg border border-border"
        aria-label="Isi keranjang"
        data-testid="daftar-keranjang"
      >
        {baris.map((b) => (
          <BarisKeranjang key={b.varianId} b={b} d={detail.get(b.varianId)} />
        ))}
      </ul>
      <aside
        className="h-fit rounded-lg border border-border bg-surface p-5"
        aria-labelledby="ringkasan"
      >
        <h2 id="ringkasan" className="text-lg font-semibold text-fg">
          Ringkasan
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Jumlah barang</dt>
            <dd data-testid="jumlah-barang">{item}</dd>
          </div>
          <div className="flex justify-between text-base font-bold text-fg">
            <dt>Subtotal</dt>
            <dd data-testid="subtotal" className="whitespace-nowrap">
              {rupiah(subtotal)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">
          Ongkos kirim dan diskon dihitung saat checkout. Harga final dihitung ulang oleh server.
        </p>
        {bisaCheckout ? (
          <ButtonLink href="/checkout" size="lg" className="mt-5 w-full" data-testid="ke-checkout">
            Lanjut ke checkout
          </ButtonLink>
        ) : (
          <p className="mt-5 text-sm text-danger" role="status">
            Tidak ada barang yang bisa dipesan.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Kosongkan seluruh isi keranjang?")) keranjang.kosongkan();
          }}
          className="mt-4 min-h-11 text-sm text-muted underline"
        >
          Kosongkan keranjang
        </button>
      </aside>
    </div>
  );
}
