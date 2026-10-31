"use client";

import { useCallback, useEffect, useState } from "react";

export type LightboxImage = { src: string; alt: string };

type Props = { images: LightboxImage[]; className?: string };

/** Galeri thumbnail + lightbox dengan navigasi panah & Esc. */
export function Lightbox({ images, className }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const count = images.length;

  const close = useCallback(() => setIndex(null), []);
  const move = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, close, move]);

  const current = index === null ? null : images[index];

  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Perbesar: ${img.alt}`}
              className="block w-full overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="aspect-4/3 w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau gambar"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.alt} className="max-h-[80vh] rounded-lg" />
            <figcaption className="mt-2 text-center text-sm text-white">{current.alt}</figcaption>
          </figure>
          <button
            type="button"
            aria-label="Sebelumnya"
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
            className="absolute left-4 top-1/2 text-3xl text-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Berikutnya"
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
            className="absolute right-4 top-1/2 text-3xl text-white"
          >
            ›
          </button>
          <button
            type="button"
            aria-label="Tutup"
            onClick={close}
            className="absolute right-4 top-4 text-2xl text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
