"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@tpl/ui";

type Props = {
  guestName: string;
  groom: string;
  bride: string;
  dateText: string;
  /** Sumber audio latar (file lokal di /public/audio). */
  audioSrc?: string;
};

/**
 * Layar pembuka: nama tamu + tombol "Buka Undangan". Saat dibuka: overlay hilang, scroll dibuka,
 * musik latar mulai (aksi pengguna → lolos kebijakan autoplay) dan tombol musik tampil.
 * Konten undangan (#isi) di-`inert` selama cover tampil agar fokus/pembaca layar tidak "bocor".
 */
export function Cover({ guestName, groom, bride, dateText, audioSrc = "/audio/latar.wav" }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Kunci scroll & inert pada konten selama cover tampil.
  useEffect(() => {
    const main = document.getElementById("isi");
    if (open) {
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
      return;
    }
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    return () => {
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
    };
  }, [open]);

  const bukaUndangan = useCallback(() => {
    setOpen(true);
    // play() bisa ditolak (mis. file hilang) — state mengikuti event audio, bukan asumsi.
    void audioRef.current?.play().catch(() => undefined);
    // Pindahkan fokus ke konten setelah cover menghilang.
    requestAnimationFrame(() => document.getElementById("isi")?.focus());
  }, []);

  const toggleMusik = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div
        id="cover"
        role="dialog"
        aria-modal="true"
        aria-label="Sampul undangan"
        hidden={open}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface px-6 text-center motion-safe:transition-opacity"
      >
        <p className="text-sm uppercase tracking-widest text-muted">Undangan Pernikahan</p>
        <h2 className="mt-4 font-serif text-4xl font-bold text-fg sm:text-6xl">
          {groom} <span className="text-primary">&amp;</span> {bride}
        </h2>
        <p className="mt-3 text-muted">{dateText}</p>

        <div className="mt-10 rounded-lg border border-border bg-bg px-6 py-4">
          <p className="text-sm text-muted">Kepada Yth.</p>
          <p className="mt-1 break-words text-xl font-semibold text-fg" data-testid="nama-tamu">
            {guestName}
          </p>
          <p className="mt-1 text-xs text-muted">
            Mohon maaf apabila ada kesalahan penulisan nama.
          </p>
        </div>

        <Button size="lg" className="mt-8" onClick={bukaUndangan}>
          Buka Undangan
        </Button>
      </div>

      {open && (
        <button
          type="button"
          onClick={toggleMusik}
          aria-pressed={playing}
          aria-label={playing ? "Matikan musik" : "Nyalakan musik"}
          className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg"
        >
          <span aria-hidden="true">{playing ? "♪" : "🔇"}</span>
        </button>
      )}

      {/* Tanpa JavaScript: tampilkan konten langsung (cover tidak bisa dibuka). */}
      <noscript>
        <style>{"#cover{display:none!important}"}</style>
      </noscript>
    </>
  );
}
