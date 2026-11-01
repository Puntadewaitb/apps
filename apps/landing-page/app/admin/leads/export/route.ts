import { isAdmin } from "../../../../lib/admin-auth";
import { toCsv } from "../../../../lib/csv";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Tidak diizinkan.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const leads = await db().lead.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(
    ["id", "waktu", "nama", "no_hp", "pesan"],
    leads.map((l) => [l.id, l.createdAt, l.name, l.phone, l.message]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
