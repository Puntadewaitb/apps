import { isAdmin } from "../../../../../lib/admin-auth";
import { toCsv } from "../../../../../lib/csv";
import { db } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Tidak diizinkan.", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const rows = await db().pesan.findMany({ orderBy: { id: "asc" } });
  const csv = toCsv(
    ["id", "waktu", "nama", "email", "telepon", "layanan", "pesan", "email_terkirim"],
    rows.map((p) => [
      p.id,
      p.createdAt,
      p.nama,
      p.email,
      p.telepon,
      p.layanan,
      p.isi,
      p.emailTerkirim ? "ya" : "tidak",
    ]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pesan-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
