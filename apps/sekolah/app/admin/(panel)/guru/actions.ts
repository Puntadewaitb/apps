"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { bersihkanUpload, simpanGambar } from "../../../../lib/upload";
import { dariForm, galatZod, guruSchema, type FormState } from "../../../../lib/validasi";

const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};

export async function simpanGuru(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("guru", "/admin/guru");
  const id = idDari(fd);
  const ada = id ? await db().teacher.findUnique({ where: { id } }) : null;
  if (id && !ada) return { ok: false, pesan: "Data guru tidak ditemukan (mungkin sudah dihapus)." };
  const p = guruSchema.safeParse(dariForm(fd));
  if (!p.success) return galatZod(p.error, dariForm(fd));

  let photo = ada?.photo ?? "";
  const file = fd.get("foto");
  if (file instanceof File && file.size > 0) {
    const h = await simpanGambar(file);
    if (!h.ok)
      return {
        ok: false,
        pesan: "Periksa kembali isian Anda.",
        errors: { foto: h.pesan },
        values: dariForm(fd),
      };
    photo = h.path;
  } else if (fd.get("hapusFoto") === "on") {
    photo = "";
  }
  const data = { ...p.data, photo };
  if (ada) {
    await db().teacher.update({ where: { id: ada.id }, data });
    if (ada.photo !== photo) await bersihkanUpload(ada.photo);
  } else {
    await db().teacher.create({ data });
  }
  redirect("/admin/guru?ok=tersimpan");
}

export async function hapusGuru(fd: FormData): Promise<void> {
  await requireAdmin("guru", "/admin/guru");
  const id = idDari(fd);
  const ada = id ? await db().teacher.findUnique({ where: { id } }) : null;
  if (ada) {
    await db().teacher.delete({ where: { id: ada.id } });
    await bersihkanUpload(ada.photo);
  }
  redirect("/admin/guru?ok=dihapus");
}
