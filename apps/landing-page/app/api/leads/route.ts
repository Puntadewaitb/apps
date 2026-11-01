import { HONEYPOT_FIELD, getClientIp, isHoneypotTripped } from "@tpl/core";
import { buildWhatsAppUrl } from "@tpl/ui";
import { site } from "../../../content/site";
import { db } from "../../../lib/db";
import { fieldErrors, leadSchema } from "../../../lib/lead-schema";
import { limiters } from "../../../lib/limiters";
import { isSameOrigin } from "../../../lib/request";

const MAX_BODY_BYTES = 10_000;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ ok: false, error: "Permintaan ditolak." }, 403);

  const ip = getClientIp(req.headers, Number(process.env.TRUSTED_PROXIES ?? 1));
  const rl = limiters().lead.check(ip);
  if (!rl.allowed) {
    return json(
      { ok: false, error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
      429,
      { "Retry-After": String(rl.retryAfterSec) },
    );
  }

  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "Format permintaan tidak didukung." }, 415);
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "Data terlalu besar." }, 413);

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Data tidak valid." }, 400);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return json({ ok: false, error: "Data tidak valid." }, 400);
  }

  // Honeypot: bot mengisi field jebakan → pura-pura sukses, tidak disimpan.
  if (isHoneypotTripped(data as Record<string, unknown>, HONEYPOT_FIELD)) {
    return json({ ok: true });
  }

  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return json(
      { ok: false, error: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error) },
      400,
    );
  }

  const { name, phone, message } = parsed.data;
  try {
    await db().lead.create({ data: { name, phone, message } });
  } catch (err) {
    console.error("[leads] gagal menyimpan", err);
    return json({ ok: false, error: "Terjadi kesalahan di server. Coba lagi nanti." }, 500);
  }

  const text = `Halo ${site.brand}, saya ${name}.${message ? `\n${message}` : ""}\nNo. HP saya: ${phone}`;
  return json({ ok: true, whatsappUrl: buildWhatsAppUrl(site.whatsapp.phone, text) }, 201);
}
