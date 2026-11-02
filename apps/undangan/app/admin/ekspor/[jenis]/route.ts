import { isAdmin } from "../../../../lib/admin-auth";
import { toCsv } from "../../../../lib/csv";
import { db } from "../../../../lib/db";
import { siteUrl } from "../../../../lib/env";
import { getActiveEvent } from "../../../../lib/event";
import { tautanTamu } from "../../../../lib/tamu";

export const dynamic = "force-dynamic";

const JENIS_EKSPOR = ["rsvp", "tamu", "ucapan"] as const;
type Ekspor = (typeof JENIS_EKSPOR)[number];

export async function GET(_req: Request, ctx: { params: Promise<{ jenis: string }> }) {
  if (!(await isAdmin())) {
    return new Response("Tidak diizinkan.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const { jenis } = await ctx.params;
  if (!(JENIS_EKSPOR as readonly string[]).includes(jenis)) {
    return new Response("Jenis ekspor tidak dikenal.", { status: 404 });
  }
  const ev = await getActiveEvent();
  if (!ev) return new Response("Acara tidak ditemukan.", { status: 404 });

  let csv: string;
  switch (jenis as Ekspor) {
    case "rsvp": {
      const rows = await db().rsvp.findMany({
        where: { eventId: ev.id },
        orderBy: { id: "asc" },
        include: { guest: { select: { code: true } } },
      });
      csv = toCsv(
        ["id", "waktu", "nama", "status", "jumlah_orang", "kode_tamu"],
        rows.map((r) => [r.id, r.createdAt, r.name, r.status, r.pax, r.guest?.code ?? ""]),
      );
      break;
    }
    case "tamu": {
      const rows = await db().guest.findMany({ where: { eventId: ev.id }, orderBy: { id: "asc" } });
      const base = siteUrl();
      csv = toCsv(
        ["id", "nama", "kode", "maks_orang", "no_hp", "tautan"],
        rows.map((g) => [g.id, g.name, g.code, g.maxPax, g.phone, tautanTamu(base, g.code)]),
      );
      break;
    }
    case "ucapan": {
      const rows = await db().wish.findMany({ where: { eventId: ev.id }, orderBy: { id: "asc" } });
      csv = toCsv(
        ["id", "waktu", "nama", "ucapan", "tampil"],
        rows.map((w) => [w.id, w.createdAt, w.name, w.message, w.visible ? "ya" : "tidak"]),
      );
      break;
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${jenis}-${ev.slug}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
