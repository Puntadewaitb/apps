import { bacaBukti, mimeBukti } from "../../../../../../lib/bukti";
import { db } from "../../../../../../lib/db";
import { apiAdmin } from "../../../../../../lib/session";

export const dynamic = "force-dynamic";

/** Bukti bayar bersifat PRIVAT: hanya admin/staf (sesi dicek ulang). Disajikan dengan CSP sandbox + nosniff. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { respons } = await apiAdmin("pesanan");
  if (respons) return respons;
  const { id } = await params;
  const mati = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^\d{1,9}$/.test(id)) return mati();
  const o = await db().order.findUnique({
    where: { id: Number(id) },
    select: { paymentProof: true, code: true },
  });
  const mime = o?.paymentProof ? mimeBukti(o.paymentProof) : undefined;
  const data = o?.paymentProof && mime ? await bacaBukti(o.paymentProof) : null;
  if (!o || !o.paymentProof || !mime || !data) return mati();
  const pdf = mime === "application/pdf";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="bukti-${o.code}.${o.paymentProof.split(".").pop()}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
