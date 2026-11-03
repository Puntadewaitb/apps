"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { slugUnik, slugify } from "../../../../lib/slug";
import { dariForm, galatZod, kategoriSchema, type FormState } from "../../../../lib/validasi";

const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};

export async function simpanKategori(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("kategori", "/admin/kategori");
  const id = idDari(fd);
  const ada = id ? await db().category.findUnique({ where: { id } }) : null;
  if (id && !ada) return { ok: false, pesan: "Kategori tidak ditemukan (mungkin sudah dihapus)." };
  const p = kategoriSchema.safeParse(dariForm(fd));
  if (!p.success) return galatZod(p.error, dariForm(fd));
  if (ada) {
    // slug TIDAK berubah saat ganti nama (tautan /produk?kategori=… tetap valid)
    await db().category.update({ where: { id: ada.id }, data: p.data });
  } else {
    const slug = await slugUnik(
      slugify(p.data.name, "kategori"),
      async (s) => !!(await db().category.findUnique({ where: { slug: s }, select: { id: true } })),
    );
    await db().category.create({ data: { ...p.data, slug } });
  }
  redirect("/admin/kategori?ok=tersimpan");
}

export async function hapusKategori(fd: FormData): Promise<void> {
  await requireAdmin("kategori", "/admin/kategori");
  const id = idDari(fd);
  const ada = id
    ? await db().category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      })
    : null;
  if (!ada) redirect("/admin/kategori?galat=tidakada");
  if (ada._count.products > 0) redirect("/admin/kategori?galat=berisi");
  await db().category.delete({ where: { id: ada.id } });
  redirect("/admin/kategori?ok=dihapus");
}
