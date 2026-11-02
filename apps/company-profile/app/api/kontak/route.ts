import { HONEYPOT_FIELD, getClientIp, isHoneypotTripped } from "@tpl/core";
import { db } from "../../../lib/db";
import { isLang, type Lang } from "../../../lib/i18n";
import { fieldErrors, kontakSchema } from "../../../lib/kontak-schema";
import { getUi } from "../../../lib/konten";
import { limiters } from "../../../lib/limiters";
import { kirimNotifikasi } from "../../../lib/mailer";
import { isSameOrigin } from "../../../lib/request";

const MAX_BODY_BYTES = 10_000;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** POST /api/kontak — simpan pesan ke DB, lalu (bila SMTP diatur) kirim notifikasi email. */
export async function POST(req: Request) {
  // Bahasa galat dari header X-Lang (nilai tak dikenal → Indonesia).
  const hdr = req.headers.get("x-lang");
  const lang: Lang = isLang(hdr) ? hdr : "id";
  const g = getUi(lang).galat;
  if (!isSameOrigin(req)) return json({ ok: false, error: g.ditolak }, 403);

  const ip = getClientIp(req.headers, Number(process.env.TRUSTED_PROXIES ?? 1));
  const rl = limiters().kontak.check(ip);
  if (!rl.allowed) {
    return json({ ok: false, error: g.terlaluBanyak }, 429, {
      "Retry-After": String(rl.retryAfterSec),
    });
  }

  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: g.formatTidakDidukung }, 415);
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: g.terlaluBesar }, 413);

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: g.dataTidakValid }, 400);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return json({ ok: false, error: g.dataTidakValid }, 400);
  }

  // Honeypot: bot mengisi field jebakan → pura-pura sukses, tidak disimpan/dikirim.
  if (isHoneypotTripped(data as Record<string, unknown>, HONEYPOT_FIELD)) return json({ ok: true });

  const parsed = kontakSchema.safeParse(data);
  if (!parsed.success) {
    return json({ ok: false, error: g.periksa, errors: fieldErrors(parsed.error, lang) }, 400);
  }

  let id: number;
  try {
    const row = await db().pesan.create({ data: parsed.data });
    id = row.id;
  } catch (err) {
    console.error("[kontak] gagal menyimpan", err);
    return json({ ok: false, error: g.server }, 500);
  }

  // Email bersifat tambahan: kegagalannya tidak membatalkan pesan yang sudah tersimpan.
  const terkirim = await kirimNotifikasi(parsed.data);
  if (terkirim)
    await db()
      .pesan.update({ where: { id }, data: { emailTerkirim: true } })
      .catch(() => undefined);

  return json({ ok: true }, 201);
}
