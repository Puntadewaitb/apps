"use client";

import { useRef, useState } from "react";
import { Markdown } from "../Markdown";

type Aksi = { label: string; aria: string; awal: string; akhir?: string; baris?: boolean };

const AKSI: Aksi[] = [
  { label: "B", aria: "Tebal", awal: "**", akhir: "**" },
  { label: "I", aria: "Miring", awal: "*", akhir: "*" },
  { label: "H2", aria: "Judul bagian", awal: "## ", baris: true },
  { label: "H3", aria: "Sub judul", awal: "### ", baris: true },
  { label: "• Daftar", aria: "Daftar butir", awal: "- ", baris: true },
  { label: "1. Daftar", aria: "Daftar bernomor", awal: "1. ", baris: true },
  { label: "❝", aria: "Kutipan", awal: "> ", baris: true },
  { label: "🔗", aria: "Tautan", awal: "[", akhir: "](https://)" },
];

/**
 * Editor teks kaya berbasis Markdown aman: toolbar menyisipkan sintaks, tab Pratinjau memakai renderer yang sama
 * dengan situs publik (tanpa HTML mentah). Tanpa JavaScript tetap berupa <textarea> biasa.
 */
export function EditorMarkdown({
  nama,
  nilaiAwal,
  error,
  id,
}: {
  nama: string;
  nilaiAwal: string;
  error?: string;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [nilai, setNilai] = useState(nilaiAwal);
  const [pratinjau, setPratinjau] = useState(false);

  function terapkan(a: Aksi) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    let baru: string;
    let kursor: number;
    if (a.baris) {
      const awalBaris = nilai.lastIndexOf("\n", s - 1) + 1;
      baru = nilai.slice(0, awalBaris) + a.awal + nilai.slice(awalBaris);
      kursor = e + a.awal.length;
    } else {
      const terpilih = nilai.slice(s, e) || "teks";
      baru = nilai.slice(0, s) + a.awal + terpilih + (a.akhir ?? "") + nilai.slice(e);
      kursor = s + a.awal.length + terpilih.length;
    }
    setNilai(baru);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(kursor, kursor);
    });
  }

  const tab = (aktif: boolean) =>
    `rounded-md px-3 py-1 text-sm font-medium ${aktif ? "bg-primary text-primary-fg" : "text-fg hover:bg-surface"}`;

  return (
    <div className="space-y-2">
      <div
        role="toolbar"
        aria-label="Pemformatan teks"
        className="flex flex-wrap items-center gap-1"
      >
        {AKSI.map((a) => (
          <button
            key={a.aria}
            type="button"
            aria-label={a.aria}
            disabled={pratinjau}
            onClick={() => terapkan(a)}
            className="min-w-9 rounded-md border border-border px-2 py-1 text-sm font-semibold text-fg hover:bg-surface disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          aria-pressed={!pratinjau}
          onClick={() => setPratinjau(false)}
          className={tab(!pratinjau)}
        >
          Tulis
        </button>
        <button
          type="button"
          aria-pressed={pratinjau}
          onClick={() => setPratinjau(true)}
          className={tab(pratinjau)}
        >
          Pratinjau
        </button>
      </div>
      {/* textarea tetap dirender (disembunyikan saat pratinjau) agar nilainya selalu ikut terkirim */}
      <textarea
        ref={ref}
        id={id}
        name={nama}
        rows={14}
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        aria-invalid={error ? true : undefined}
        hidden={pratinjau}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg aria-[invalid=true]:border-danger"
      />
      {pratinjau && (
        <div data-testid="pratinjau" className="min-h-40 rounded-md border border-border bg-bg p-4">
          {nilai.trim() ? (
            <Markdown source={nilai} />
          ) : (
            <p className="text-muted">Belum ada isi.</p>
          )}
        </div>
      )}
    </div>
  );
}
