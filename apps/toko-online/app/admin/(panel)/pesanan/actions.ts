"use server";

import { sanitizeText } from "@tpl/core";
import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { bolehPindah, mengembalikanStok } from "../../../../lib/status";

const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};

/**
 * Ubah status pesanan. Seluruhnya dalam SATU transaksi dengan compare-and-set pada status yang dilihat admin:
 *  - status di DB harus sama dengan yang dilihat admin (cegah dua admin menimpa / aksi ganda),
 *  - transisi harus sah menurut peta status,
 *  - pembatalan mengembalikan stok tiap item (varian yang sudah dihapus dilewati) dan kuota voucher — tepat SEKALI
 *    karena hanya satu permintaan yang lolos CAS.
 */
export async function ubahStatus(fd: FormData): Promise<void> {
  await requireAdmin("pesanan", "/admin/pesanan");
  const id = idDari(fd);
  const ke = String(fd.get("ke") ?? "");
  const dari = String(fd.get("dari") ?? "");
  if (!id) redirect("/admin/pesanan?galat=tidakada");
  const hasil = await db().$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!o) return "tidakada";
    if (o.status !== dari) return "statusberubah";
    if (!bolehPindah(o.status, ke)) return "transisi";
    const u = await tx.order.updateMany({ where: { id, status: o.status }, data: { status: ke } });
    if (u.count !== 1) return "statusberubah";
    if (mengembalikanStok(ke)) {
      for (const it of o.items)
        if (it.variantId !== null)
          await tx.variant.updateMany({
            where: { id: it.variantId },
            data: { stock: { increment: it.qty } },
          });
      if (o.voucherCode)
        await tx.$executeRaw`UPDATE "Voucher" SET used = used - 1 WHERE code = ${o.voucherCode} AND used > 0`;
    }
    return "ok";
  });
  if (hasil === "ok") redirect(`/admin/pesanan/${id}?ok=status`);
  redirect(`/admin/pesanan/${id}?galat=${hasil}`);
}

export async function simpanCatatan(fd: FormData): Promise<void> {
  await requireAdmin("pesanan", "/admin/pesanan");
  const id = idDari(fd);
  const catatan = sanitizeText(String(fd.get("catatan") ?? ""), {
    maxLength: 1000,
    multiline: true,
  });
  if (!id) redirect("/admin/pesanan?galat=tidakada");
  if (catatan.length > 500) redirect(`/admin/pesanan/${id}?galat=catatan`);
  const u = await db().order.updateMany({ where: { id }, data: { adminNote: catatan } });
  redirect(u.count === 1 ? `/admin/pesanan/${id}?ok=catatan` : "/admin/pesanan?galat=tidakada");
}
