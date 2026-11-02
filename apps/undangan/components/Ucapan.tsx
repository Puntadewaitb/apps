"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, Card, FormField, Section } from "@tpl/ui";

export type WishItem = { id: number; name: string; message: string; createdAt: string };
type Errors = Record<string, string>;

const POLL_MS = 15_000;

const waktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

/** Gabungkan dua daftar berdasarkan id, terbaru (id terbesar) dulu. */
export function mergeWishes(a: WishItem[], b: WishItem[]): WishItem[] {
  const map = new Map<number, WishItem>();
  for (const w of [...a, ...b]) map.set(w.id, w);
  return [...map.values()].sort((x, y) => y.id - x.id);
}

type Props = { initial: WishItem[]; nextCursor: number | null; defaultName?: string };

export function Ucapan({ initial, nextCursor: initialCursor, defaultName = "" }: Props) {
  const [items, setItems] = useState<WishItem[]>(initial);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [errors, setErrors] = useState<Errors>({});
  const [info, setInfo] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-refresh: ambil halaman pertama berkala (dijeda saat tab tidak terlihat).
  useEffect(() => {
    let stop = false;
    async function tick() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/ucapan", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { items: WishItem[] };
        if (!stop) setItems((cur) => mergeWishes(data.items, cur));
      } catch {
        /* jaringan putus: coba lagi di tick berikutnya */
      }
    }
    const id = setInterval(tick, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const muatLagi = useCallback(async () => {
    if (cursor === null) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/ucapan?cursor=${cursor}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { items: WishItem[]; nextCursor: number | null };
        setItems((cur) => mergeWishes(cur, data.items));
        setCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [cursor]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setInfo(null);
    setErrors({});
    try {
      const res = await fetch("/api/ucapan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        visible?: boolean;
        item?: WishItem;
        error?: string;
        errors?: Errors;
      };
      if (res.ok && data.ok) {
        if (data.item) setItems((cur) => mergeWishes([data.item!], cur));
        setInfo(
          data.visible
            ? { tone: "ok", text: "Terima kasih! Ucapan Anda telah tampil." }
            : { tone: "ok", text: "Terima kasih! Ucapan Anda akan tampil setelah ditinjau." },
        );
        formRef.current?.reset();
        return;
      }
      setErrors(data.errors ?? {});
      setInfo({ tone: "error", text: data.error ?? "Gagal mengirim. Coba lagi." });
    } catch {
      setInfo({ tone: "error", text: "Koneksi bermasalah. Coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      id="ucapan"
      tone="surface"
      title="Ucapan & Doa"
      subtitle="Tuliskan ucapan dan doa terbaik untuk kedua mempelai."
    >
      <div className="grid gap-10 md:grid-cols-2">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          aria-label="Form ucapan"
          className="space-y-4"
        >
          <FormField label="Nama" required error={errors.name}>
            <input
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={defaultName}
              className={input}
            />
          </FormField>
          <FormField label="Ucapan & doa" required error={errors.message} hint="3–500 karakter">
            <textarea name="message" rows={4} maxLength={600} className={input} />
          </FormField>
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Jangan diisi
              <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          {info && (
            <p
              role={info.tone === "error" ? "alert" : "status"}
              className={`text-sm ${info.tone === "error" ? "text-danger" : "text-success"}`}
            >
              {info.text}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Mengirim…" : "Kirim Ucapan"}
          </Button>
        </form>

        <div>
          <h3 className="sr-only">Daftar ucapan</h3>
          {items.length === 0 ? (
            <p className="text-muted" data-testid="ucapan-kosong">
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          ) : (
            <ul
              className="max-h-[32rem] space-y-3 overflow-y-auto pr-1"
              data-testid="daftar-ucapan"
              aria-live="polite"
            >
              {items.map((w) => (
                <li key={w.id}>
                  <Card>
                    <p className="whitespace-pre-wrap break-words text-fg">{w.message}</p>
                    <p className="mt-2 text-sm">
                      <strong className="text-fg">{w.name}</strong>
                      <span className="text-muted"> · {waktu.format(new Date(w.createdAt))}</span>
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          {cursor !== null && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={muatLagi}
              disabled={loadingMore}
            >
              {loadingMore ? "Memuat…" : "Muat ucapan lainnya"}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
