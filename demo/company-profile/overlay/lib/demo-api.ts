// OVERLAY sample statis: pengganti fetch("/api/kontak") — TIDAK ada server/email. Pesan hanya disimpan di localStorage
// peramban pengunjung sendiri. Validasi memakai skema & pesan galat yang SAMA dengan versi lengkap (ID/EN).
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { isLang, type Lang } from "./i18n";
import { fieldErrors, kontakSchema } from "./kontak-schema";
import { getUi } from "./konten";

const KEY = "demo:company-profile:pesan";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function demoFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, "http://demo.local");
  if (url.pathname !== "/api/kontak" || (init?.method ?? "GET").toUpperCase() !== "POST")
    return json({ ok: false, error: "Tidak tersedia di versi demo." }, 404);

  const hdr = new Headers(init?.headers).get("x-lang");
  const lang: Lang = isLang(hdr) ? hdr : "id";
  const g = getUi(lang).galat;

  let data: unknown;
  try {
    data = JSON.parse(String(init?.body ?? ""));
  } catch {
    return json({ ok: false, error: g.dataTidakValid }, 400);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data))
    return json({ ok: false, error: g.dataTidakValid }, 400);
  if ((data as Record<string, unknown>)[HONEYPOT_FIELD]) return json({ ok: true });

  const parsed = kontakSchema.safeParse(data);
  if (!parsed.success)
    return json({ ok: false, error: g.periksa, errors: fieldErrors(parsed.error, lang) }, 400);

  try {
    const lama = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown[];
    window.localStorage.setItem(
      KEY,
      JSON.stringify([...lama, { ...parsed.data, waktu: new Date().toISOString() }]),
    );
  } catch {
    /* penyimpanan diblokir: tetap sukses (hanya simulasi) */
  }
  return json({ ok: true }, 201);
}
