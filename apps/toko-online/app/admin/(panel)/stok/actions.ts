"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { MAKS_STOK } from "../../../../lib/validasi";

/**
 * Penyesuaian stok sebagai SELISIH (+/−), bukan nilai mutlak: atomik terhadap pesanan yang masuk bersamaan
 * (menetapkan nilai mutlak akan menimpa pengurangan oleh checkout). Hasil tak boleh < 0 atau > batas.
 */
export async function ubahStok(fd: FormData): Promise<void> {
  await requireAdmin("stok", "/admin/stok");
  const id = /^\d{1,9}$/.test(String(fd.get("id") ?? "")) ? Number(fd.get("id")) : 0;
  const deltaRaw = String(fd.get("delta") ?? "").trim();
  const q = String(fd.get("q") ?? "").slice(0, 60);
  const balik = (k: "ok" | "galat", v: string) =>
    redirect(`/admin/stok?${k}=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  if (!/^[+-]?\d{1,7}$/.test(deltaRaw) || Number(deltaRaw) === 0) balik("galat", "stoktidaksah");
  const delta = Number(deltaRaw);
  if (!id || Math.abs(delta) > MAKS_STOK) balik("galat", "stoktidaksah");
  const v = await db().variant.findUnique({ where: { id }, select: { stock: true } });
  if (!v) balik("galat", "tidakada");
  const u = await db().variant.updateMany({
    where: { id, stock: delta < 0 ? { gte: -delta } : { lte: MAKS_STOK - delta } },
    data: { stock: { increment: delta } },
  });
  if (u.count !== 1) balik("galat", delta < 0 ? "stokminus" : "stoktidaksah");
  balik("ok", "stok");
}
