import { toCsv } from "../../../../../lib/csv";
import { db } from "../../../../../lib/db";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, isOneOf } from "../../../../../lib/domain";
import { apiAdmin } from "../../../../../lib/session";

export const dynamic = "force-dynamic";

const wib = (d: Date) =>
  new Date(d.getTime() + 7 * 3_600_000).toISOString().replace("T", " ").slice(0, 16);

/**
 * GET /admin/pesanan/ekspor[?status=DIBAYAR] — CSV pesanan (area "laporan": hanya ADMIN, karena memuat data pribadi massal).
 * Sel berawalan = + - @ dinetralkan (CSV/formula injection). Batas 5.000 baris.
 */
export async function GET(req: Request) {
  const { respons } = await apiAdmin("laporan");
  if (respons) return respons;
  const st = new URL(req.url).searchParams.get("status")?.toUpperCase();
  const status = isOneOf(ORDER_STATUSES, st) ? st : undefined;
  const rows = await db().order.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 5000,
    include: { items: { orderBy: { id: "asc" } } },
  });
  const csv = toCsv(
    [
      "Kode",
      "Waktu (WIB)",
      "Status",
      "Nama",
      "No. HP",
      "Email",
      "Kota",
      "Alamat",
      "Catatan pembeli",
      "Subtotal",
      "Ongkir",
      "Diskon",
      "Voucher",
      "Total",
      "Item",
      "Catatan admin",
    ],
    rows.map((o) => [
      o.code,
      wib(o.createdAt),
      isOneOf(ORDER_STATUSES, o.status) ? ORDER_STATUS_LABEL[o.status] : o.status,
      o.customerName,
      o.customerPhone,
      o.customerEmail,
      o.city,
      o.address,
      o.note,
      o.subtotal,
      o.shippingCost,
      o.discount,
      o.voucherCode,
      o.total,
      o.items
        .map(
          (i) =>
            `${i.productName}${i.variantName !== "Standar" ? ` (${i.variantName})` : ""} x${i.qty}`,
        )
        .join("; "),
      o.adminNote,
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pesanan${status ? `-${status.toLowerCase()}` : ""}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
