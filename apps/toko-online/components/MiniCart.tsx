"use client";

import { useEffect, useId, useRef, useState } from "react";
import { rupiah } from "../lib/format";
import { hitungSubtotal, jumlahItem, qtyEfektif } from "../lib/keranjang";
import { useDetail, useKeranjang, useSiap } from "../lib/keranjang-store";

/** Tombol keranjang di navbar + panel ringkas (mini-cart). Panel mengambil data harga/stok terbaru dari server saat dibuka. */
export function MiniCart() {
  const baris = useKeranjang();
  const siap = useSiap();
  const [buka, setBuka] = useState(false);
  const id = useId();
  const akar = useRef<HTMLDivElement>(null);
  const tombol = useRef<HTMLButtonElement>(null);
  const { detail, status } = useDetail(
    baris.map((b) => b.varianId),
    buka,
  );
  const jumlah = jumlahItem(baris);

  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBuka(false);
        tombol.current?.focus();
      }
    };
    const onKlik = (e: MouseEvent) => {
      if (akar.current && !akar.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onKlik);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onKlik);
    };
  }, [buka]);

  const { subtotal } = hitungSubtotal(baris, detail);
  const label = siap ? `Keranjang, ${jumlah} item` : "Keranjang";

  return (
    <div ref={akar} className="sm:relative">
      <button
        ref={tombol}
        type="button"
        aria-label={label}
        aria-expanded={buka}
        aria-controls={id}
        onClick={() => setBuka((v) => !v)}
        data-testid="tombol-keranjang"
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-fg hover:bg-surface"
      >
        <span aria-hidden="true">🛒</span>
        {siap && jumlah > 0 && (
          <span
            aria-hidden="true"
            data-testid="jumlah-keranjang"
            className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-xs font-bold leading-5 text-primary-fg"
          >
            {jumlah > 99 ? "99+" : jumlah}
          </span>
        )}
      </button>
      <noscript>
        <a href="/keranjang">Keranjang</a>
      </noscript>
      {buka && (
        <div
          id={id}
          role="region"
          aria-label="Ringkasan keranjang"
          data-testid="mini-cart"
          className="absolute left-4 right-4 top-full z-50 mt-2 rounded-lg border border-border bg-bg p-4 shadow-lg sm:left-auto sm:right-0 sm:w-80"
        >
          {baris.length === 0 ? (
            <p className="text-sm text-muted">Keranjang masih kosong.</p>
          ) : status === "memuat" ? (
            <p className="text-sm text-muted" role="status">
              Memuat…
            </p>
          ) : status === "galat" ? (
            <p className="text-sm text-danger" role="alert">
              Gagal memuat ringkasan keranjang.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto">
              {baris.map((b) => {
                const d = detail.get(b.varianId);
                if (!d || !d.tersedia)
                  return (
                    <li key={b.varianId} className="py-2 text-sm text-muted">
                      Produk tidak tersedia lagi
                    </li>
                  );
                const q = qtyEfektif(b.qty, d.stok);
                return (
                  <li key={b.varianId} className="flex gap-3 py-2 text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.gambar}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded border border-border"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-fg">{d.produkNama}</p>
                      <p className="text-xs text-muted">{d.varianNama}</p>
                      <p className="text-xs text-muted">
                        {q} × {rupiah(d.harga)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {baris.length > 0 && status === "siap" && (
            <p className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold text-fg">
              <span>Subtotal</span>
              <span data-testid="mini-subtotal">{rupiah(subtotal)}</span>
            </p>
          )}
          <a
            href="/keranjang"
            className="mt-3 block rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-fg hover:opacity-90"
            onClick={() => setBuka(false)}
          >
            Lihat keranjang
          </a>
        </div>
      )}
    </div>
  );
}
