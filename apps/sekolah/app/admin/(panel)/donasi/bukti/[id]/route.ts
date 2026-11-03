import { db } from "../../../../../../lib/db";
import { bacaDokumen, mimeDokumen } from "../../../../../../lib/dokumen";
import { apiAdmin } from "../../../../../../lib/session";

export const dynamic = "force-dynamic";

/** Bukti transfer bersifat PRIVAT: hanya admin berhak (sesi dicek ulang). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { respons } = await apiAdmin("donasi");
  if (respons) return respons;
  const { id } = await params;
  const mati = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^\d{1,9}$/.test(id)) return mati();
  const d = await db().donation.findUnique({
    where: { id: Number(id) },
    select: { proofPath: true },
  });
  const mime = d?.proofPath ? mimeDokumen(d.proofPath) : undefined;
  const data = d?.proofPath && mime ? await bacaDokumen(d.proofPath) : null;
  if (!d?.proofPath || !mime || !data) return mati();
  const pdf = mime === "application/pdf";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="bukti-${id}.${d.proofPath.split(".").pop()}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
