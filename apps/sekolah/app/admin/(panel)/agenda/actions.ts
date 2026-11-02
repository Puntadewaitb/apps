"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { agendaSchema, dariForm, galatZod, type FormState } from "../../../../lib/validasi";

const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};

export async function simpanAgenda(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("agenda", "/admin/agenda");
  const id = idDari(fd);
  if (id && !(await db().agenda.findUnique({ where: { id }, select: { id: true } })))
    return { ok: false, pesan: "Agenda tidak ditemukan (mungkin sudah dihapus)." };
  const p = agendaSchema.safeParse(dariForm(fd));
  if (!p.success) return galatZod(p.error, dariForm(fd));
  const { title, description, location, startsAt, endsAt } = p.data;
  const data = { title, description, location, startsAt, endsAt };
  if (id) await db().agenda.update({ where: { id }, data });
  else await db().agenda.create({ data });
  redirect("/admin/agenda?ok=tersimpan");
}

export async function hapusAgenda(fd: FormData): Promise<void> {
  await requireAdmin("agenda", "/admin/agenda");
  const id = idDari(fd);
  if (id) await db().agenda.deleteMany({ where: { id } });
  redirect("/admin/agenda?ok=dihapus");
}
