"use server";

import { sanitizeText } from "@tpl/core";
import { revalidatePath } from "next/cache";
import { db } from "../../../../lib/db";
import { REG_STATUSES, isOneOf } from "../../../../lib/domain";
import { requireAdmin } from "../../../../lib/session";
import { dariForm, type FormState } from "../../../../lib/validasi";

export async function ubahStatusPpdb(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("ppdb", "/admin/ppdb");
  const v = dariForm(fd);
  const id = /^\d{1,9}$/.test(v.id ?? "") ? Number(v.id) : undefined;
  const ada = id
    ? await db().registration.findUnique({ where: { id }, select: { id: true } })
    : null;
  if (!ada) return { ok: false, pesan: "Data pendaftaran tidak ditemukan." };
  if (!isOneOf(REG_STATUSES, v.status))
    return {
      ok: false,
      pesan: "Periksa kembali isian Anda.",
      errors: { status: "Status tidak valid." },
      values: v,
    };
  const adminNote = sanitizeText(v.adminNote ?? "", { maxLength: 1000, multiline: true });
  if (adminNote.length > 500)
    return {
      ok: false,
      pesan: "Periksa kembali isian Anda.",
      errors: { adminNote: "Catatan maksimal 500 karakter." },
      values: v,
    };
  await db().registration.update({ where: { id: ada.id }, data: { status: v.status, adminNote } });
  revalidatePath(`/admin/ppdb/${ada.id}`);
  return { ok: true, pesan: "Status tersimpan.", values: { status: v.status, adminNote } };
}
