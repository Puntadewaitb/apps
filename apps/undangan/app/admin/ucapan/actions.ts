"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { getActiveEvent } from "../../../lib/event";

const AKSI = ["tampil", "sembunyi", "hapus"] as const;

/** Moderasi ucapan: tampilkan / sembunyikan / hapus. Hanya untuk ucapan milik acara aktif. */
export async function moderasiUcapan(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const aksi = String(formData.get("aksi"));
  if (!Number.isInteger(id) || id <= 0 || !(AKSI as readonly string[]).includes(aksi)) return;
  const ev = await getActiveEvent();
  if (!ev) return;
  const where = { id, eventId: ev.id };
  if (aksi === "hapus") await db().wish.deleteMany({ where });
  else await db().wish.updateMany({ where, data: { visible: aksi === "tampil" } });
  revalidatePath("/admin/ucapan");
  revalidatePath("/admin");
}
