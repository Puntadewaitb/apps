"use client";

// Banner "versi demo" — disisipkan OLEH BUILD ke root layout salinan (scripts/demo/build.mjs), dirender oleh React
// sehingga konsisten dengan hydration. Tidak pernah ikut build versi lengkap.
//
// Juga MENCEGAT tautan WhatsApp (wa.me / api.whatsapp.com): nomor di data contoh fiktif dan bisa saja milik orang
// sungguhan, jadi pengunjung demo tidak boleh terkirim ke sana (apalagi membawa nama/nomor HP yang mereka isi di form).
import { useEffect, useState } from "react";

const WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i;

export function DemoBanner() {
  const kontak = process.env.NEXT_PUBLIC_DEMO_CONTACT_URL;
  const label = process.env.NEXT_PUBLIC_DEMO_CONTACT_LABEL || "Pesan versi lengkap";
  const [info, setInfo] = useState(false);

  useEffect(() => {
    const cegat = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || !WA.test(a.getAttribute("href") ?? "")) return;
      e.preventDefault();
      e.stopPropagation();
      setInfo(true);
    };
    document.addEventListener("click", cegat, true);
    return () => document.removeEventListener("click", cegat, true);
  }, []);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(false), 6000);
    return () => clearTimeout(t);
  }, [info]);

  return (
    <>
      <div
        id="demo-banner"
        role="note"
        style={{
          background: "#111827",
          color: "#fff",
          font: "14px/1.5 system-ui, sans-serif",
          padding: "8px 16px",
          textAlign: "center",
        }}
      >
        <strong>Versi demo</strong> — tampilan contoh; data tidak disimpan di server dan panel admin
        tidak disertakan.
        {kontak ? (
          <>
            {" "}
            <a
              href={kontak}
              style={{ color: "#93c5fd", textDecoration: "underline", fontWeight: 600 }}
            >
              {label}
            </a>
          </>
        ) : null}
      </div>
      {info && (
        <div
          role="status"
          data-testid="demo-info-wa"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 100,
            margin: "0 auto",
            maxWidth: 480,
            background: "#111827",
            color: "#fff",
            font: "14px/1.5 system-ui, sans-serif",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.3)",
          }}
        >
          Di versi demo tombol WhatsApp tidak dibuka (nomornya contoh). Pada versi lengkap, tombol
          ini langsung membuka chat WhatsApp bisnis Anda beserta pesan yang sudah terisi.
        </div>
      )}
    </>
  );
}
