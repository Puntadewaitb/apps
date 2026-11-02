"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@tpl/ui";
import { browserClipboardDeps, copyText } from "../lib/clipboard";

type Props = {
  /** Teks yang disalin */
  text: string;
  /** Label aksesibel, mis. "Salin nomor rekening Bank Nusantara" */
  label: string;
  className?: string;
};

type Status = "idle" | "ok" | "gagal";

/** Tombol salin dengan umpan balik (aria-live) yang kembali normal setelah 2 detik. */
export function CopyButton({ text, label, className }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  async function onClick() {
    const ok = await copyText(text, browserClipboardDeps());
    setStatus(ok ? "ok" : "gagal");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <span className={className}>
      <Button type="button" variant="secondary" size="sm" onClick={onClick} aria-label={label}>
        {status === "ok" ? "Tersalin ✓" : "Salin"}
      </Button>
      <span role="status" aria-live="polite" className="ml-2 text-sm text-danger">
        {status === "gagal" ? "Gagal menyalin. Silakan salin secara manual." : ""}
      </span>
    </span>
  );
}
