import { db } from "../../../../../lib/db";
import { toCsv } from "../../../../../lib/csv";
import { REG_STATUSES, REG_STATUS_LABEL, isOneOf } from "../../../../../lib/domain";
import { labelDokumen } from "../../../../../content/ppdb";
import { parseDokumen } from "../../../../../lib/dokumen";
import { apiAdmin } from "../../../../../lib/session";

export const dynamic = "force-dynamic";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** GET /admin/ppdb/ekspor[?status=baru|diproses|diterima|ditolak] — CSV (sel berawalan = + - @ dinetralkan). */
export async function GET(req: Request) {
  const { respons } = await apiAdmin("ppdb");
  if (respons) return respons;
  const st = new URL(req.url).searchParams.get("status")?.toUpperCase();
  const status = isOneOf(REG_STATUSES, st) ? st : undefined;
  const rows = await db().registration.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const csv = toCsv(
    [
      "No. pendaftaran",
      "Tanggal daftar",
      "Status",
      "Nama calon siswa",
      "Tempat lahir",
      "Tanggal lahir",
      "Jenis kelamin",
      "Asal sekolah",
      "Jenjang tujuan",
      "Alamat",
      "Nama orang tua/wali",
      "No. HP",
      "Email",
      "Pekerjaan",
      "Dokumen",
      "Catatan panitia",
    ],
    rows.map((r) => [
      r.regNo,
      ymd(r.createdAt),
      isOneOf(REG_STATUSES, r.status) ? REG_STATUS_LABEL[r.status] : r.status,
      r.studentName,
      r.birthPlace,
      ymd(r.birthDate),
      r.gender === "L" ? "Laki-laki" : "Perempuan",
      r.previousSchool,
      r.targetGrade,
      r.address,
      r.parentName,
      r.parentPhone,
      r.parentEmail,
      r.parentJob,
      parseDokumen(r.documents)
        .map((d) => labelDokumen(d.kind))
        .join("; "),
      r.adminNote,
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ppdb-${ymd(new Date())}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
