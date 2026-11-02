import { db } from "../../../lib/db";
import { fieldErrors, guardPost, json } from "../../../lib/api";
import { getActiveEvent } from "../../../lib/event";
import { limiters } from "../../../lib/limiters";
import { DEFAULT_MAX_PAX, effectivePax, rsvpSchema } from "../../../lib/schemas";

/** POST /api/rsvp — konfirmasi kehadiran. Bila `kode` tamu valid, RSVP tamu itu diperbarui (bukan digandakan). */
export async function POST(req: Request) {
  const g = await guardPost(req, limiters().rsvp);
  if (!g.ok) return g.res;
  if (g.bot) return json({ ok: true }); // honeypot: pura-pura sukses

  const parsed = rsvpSchema.safeParse(g.data);
  if (!parsed.success) {
    return json(
      { ok: false, error: "Periksa kembali isian Anda.", errors: fieldErrors(parsed.error) },
      400,
    );
  }
  const { name, status, pax, kode } = parsed.data;

  const ev = await getActiveEvent();
  if (!ev) return json({ ok: false, error: "Acara tidak ditemukan." }, 404);

  try {
    const guest = kode
      ? await db().guest.findUnique({ where: { code: kode.toUpperCase() } })
      : null;
    if (kode && (!guest || guest.eventId !== ev.id)) {
      return json(
        {
          ok: false,
          error: "Periksa kembali isian Anda.",
          errors: { kode: "Kode tamu tidak ditemukan" },
        },
        400,
      );
    }
    const finalPax = effectivePax(status, pax, guest?.maxPax ?? DEFAULT_MAX_PAX);

    if (guest) {
      const existing = await db().rsvp.findFirst({ where: { eventId: ev.id, guestId: guest.id } });
      if (existing) {
        await db().rsvp.update({
          where: { id: existing.id },
          data: { name, status, pax: finalPax },
        });
        return json({ ok: true, updated: true, status, pax: finalPax });
      }
    }
    await db().rsvp.create({
      data: { eventId: ev.id, guestId: guest?.id ?? null, name, status, pax: finalPax },
    });
    return json({ ok: true, updated: false, status, pax: finalPax }, 201);
  } catch (err) {
    console.error("[rsvp] gagal menyimpan", err);
    return json({ ok: false, error: "Terjadi kesalahan di server. Coba lagi nanti." }, 500);
  }
}
