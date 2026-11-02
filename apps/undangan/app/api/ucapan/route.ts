import { getClientIp } from "@tpl/core";
import { db } from "../../../lib/db";
import { fieldErrors, guardPost, json } from "../../../lib/api";
import { getActiveEvent } from "../../../lib/event";
import { limiters } from "../../../lib/limiters";
import { moderationEnabled, wishSchema, wishVisibility } from "../../../lib/schemas";
import { listVisibleWishes } from "../../../lib/wishes";

export const dynamic = "force-dynamic";

/** GET /api/ucapan?cursor=<id> — ucapan yang tampil, terbaru dulu (untuk auto-refresh & "muat lagi"). */
export async function GET(req: Request) {
  const ip = getClientIp(req.headers, Number(process.env.TRUSTED_PROXIES ?? 1));
  const rl = limiters().read.check(ip);
  if (!rl.allowed) {
    return json({ ok: false, error: "Terlalu banyak permintaan." }, 429, {
      "Retry-After": String(rl.retryAfterSec),
    });
  }
  const ev = await getActiveEvent();
  if (!ev) return json({ ok: false, error: "Acara tidak ditemukan." }, 404);

  const raw = new URL(req.url).searchParams.get("cursor");
  let cursor: number | undefined;
  if (raw !== null) {
    if (!/^\d{1,9}$/.test(raw))
      return json({ ok: false, error: "Parameter cursor tidak valid." }, 400);
    cursor = Number(raw);
  }
  return json({ ok: true, ...(await listVisibleWishes(ev.id, cursor)) });
}

/** POST /api/ucapan — kirim ucapan & doa. Spam (tautan) / moderasi aktif → disimpan tapi disembunyikan. */
export async function POST(req: Request) {
  const g = await guardPost(req, limiters().wish);
  if (!g.ok) return g.res;
  if (g.bot) return json({ ok: true, visible: false });

  const parsed = wishSchema.safeParse(g.data);
  if (!parsed.success) {
    return json(
      { ok: false, error: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error) },
      400,
    );
  }
  const ev = await getActiveEvent();
  if (!ev) return json({ ok: false, error: "Acara tidak ditemukan." }, 404);

  const { name, message } = parsed.data;
  const visible = wishVisibility(message, moderationEnabled());
  try {
    const w = await db().wish.create({ data: { eventId: ev.id, name, message, visible } });
    return json(
      {
        ok: true,
        visible,
        ...(visible
          ? {
              item: {
                id: w.id,
                name: w.name,
                message: w.message,
                createdAt: w.createdAt.toISOString(),
              },
            }
          : {}),
      },
      201,
    );
  } catch (err) {
    console.error("[ucapan] gagal menyimpan", err);
    return json({ ok: false, error: "Terjadi kesalahan di server. Coba lagi nanti." }, 500);
  }
}
