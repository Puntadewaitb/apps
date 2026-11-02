import { DOKUMEN_KINDS } from "../../../../../../../content/ppdb";
import { db } from "../../../../../../../lib/db";
import { bacaDokumen, mimeDokumen, parseDokumen } from "../../../../../../../lib/dokumen";
import { apiAdmin } from "../../../../../../../lib/session";

export const dynamic = "force-dynamic";

/** Dokumen PPDB bersifat PRIVAT: hanya admin berhak (cek sesi ulang), dan hanya berkas milik pendaftar tsb. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { respons } = await apiAdmin("ppdb");
  if (respons) return respons;
  const { id, kind } = await params;
  const mati = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^\d{1,9}$/.test(id) || !(DOKUMEN_KINDS as string[]).includes(kind)) return mati();
  const r = await db().registration.findUnique({
    where: { id: Number(id) },
    select: { documents: true },
  });
  const d = r ? parseDokumen(r.documents).find((x) => x.kind === kind) : undefined;
  const mime = d ? mimeDokumen(d.file) : undefined;
  const data = d && mime ? await bacaDokumen(d.file) : null;
  if (!d || !mime || !data) return mati();
  const pdf = mime === "application/pdf";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="${kind}-${id}.${d.file.split(".").pop()}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
