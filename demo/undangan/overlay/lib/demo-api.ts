// OVERLAY sample statis: pengganti fetch("/api/rsvp" | "/api/ucapan") — TIDAK ada server. Data hanya tersimpan di
// localStorage peramban pengunjung sendiri. Validasi memakai skema yang SAMA dengan versi lengkap
// (lib/schemas.ts), jadi pesan galat & aturan (spam bertaut, batas karakter, jumlah orang) identik.
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import type { z } from "zod";
import {
  DEFAULT_MAX_PAX,
  effectivePax,
  rsvpSchema,
  wishSchema,
  wishVisibility,
  type RsvpStatus,
} from "./schemas";

const KEY_WISH = "demo:undangan:ucapan";
const KEY_RSVP = "demo:undangan:rsvp";
/** Di atas id seed agar ucapan baru tampil paling atas (daftar diurut id menurun). */
const ID_AWAL = 1_000_000;

type Wish = { id: number; name: string; message: string; createdAt: string };
type Rsvp = { name: string; status: RsvpStatus; pax: number };

function baca<T>(key: string, awal: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : awal;
  } catch {
    return awal;
  }
}
function tulis(key: string, nilai: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(nilai));
  } catch {
    /* penyimpanan diblokir: tetap sukses (hanya simulasi) */
  }
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBody(init?: RequestInit): Record<string, unknown> | null {
  try {
    const data: unknown = JSON.parse(String(init?.body ?? ""));
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function demoFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, "http://demo.local");
  const method = (init?.method ?? "GET").toUpperCase();

  if (url.pathname === "/api/ucapan") {
    const tersimpan = baca<Wish[]>(KEY_WISH, []);
    if (method === "GET") {
      // Ucapan seed sudah ada di HTML; di sini hanya milik pengunjung ini. Halaman berikutnya selalu kosong.
      return json({
        ok: true,
        items: url.searchParams.has("cursor") ? [] : tersimpan,
        nextCursor: null,
      });
    }
    const data = parseBody(init);
    if (!data) return json({ ok: false, error: "Data tidak valid." }, 400);
    if (data[HONEYPOT_FIELD]) return json({ ok: true, visible: false });
    const parsed = wishSchema.safeParse(data);
    if (!parsed.success)
      return json(
        { ok: false, error: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error) },
        400,
      );
    const { name, message } = parsed.data;
    const visible = wishVisibility(message, false);
    if (!visible) return json({ ok: true, visible: false }, 201); // terindikasi spam → "menunggu tinjauan"
    const item: Wish = {
      id: ID_AWAL + tersimpan.length + 1,
      name,
      message,
      createdAt: new Date().toISOString(),
    };
    tulis(KEY_WISH, [item, ...tersimpan]);
    return json({ ok: true, visible: true, item }, 201);
  }

  if (url.pathname === "/api/rsvp" && method === "POST") {
    const data = parseBody(init);
    if (!data) return json({ ok: false, error: "Data tidak valid." }, 400);
    if (data[HONEYPOT_FIELD]) return json({ ok: true });
    const parsed = rsvpSchema.safeParse(data);
    if (!parsed.success)
      return json(
        { ok: false, error: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error) },
        400,
      );
    const { name, status, pax, kode } = parsed.data;
    const finalPax = effectivePax(status, pax, DEFAULT_MAX_PAX);
    const semua = baca<Record<string, Rsvp>>(KEY_RSVP, {});
    const id = (kode ?? "umum").toUpperCase();
    const updated = id in semua;
    tulis(KEY_RSVP, { ...semua, [id]: { name, status, pax: finalPax } });
    return json({ ok: true, updated, status, pax: finalPax }, updated ? 200 : 201);
  }

  return json({ ok: false, error: "Tidak tersedia di versi demo." }, 404);
}
