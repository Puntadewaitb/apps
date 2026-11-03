"use client";

import { useState } from "react";

/** Gambar utama + thumbnail (tombol, bisa dengan keyboard). */
export function GaleriProduk({ gambar, nama }: { gambar: string[]; nama: string }) {
  const [i, setI] = useState(0);
  const aktif = gambar[i] ?? gambar[0];
  if (!aktif) return null;
  return (
    <div data-testid="galeri">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={aktif}
        alt={`${nama} — gambar ${i + 1} dari ${gambar.length}`}
        width={800}
        height={800}
        fetchPriority="high"
        decoding="async"
        className="h-auto w-full rounded-xl border border-border"
        data-testid="gambar-utama"
      />
      {gambar.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Pilih gambar">
          {gambar.map((g, n) => (
            <li key={g}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`Lihat gambar ${n + 1}`}
                aria-pressed={n === i}
                className={`block w-full overflow-hidden rounded-md border-2 ${n === i ? "border-primary" : "border-border"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
