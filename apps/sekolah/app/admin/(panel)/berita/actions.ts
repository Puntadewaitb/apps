"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { slugify, slugPostUnik } from "../../../../lib/slug";
import { bersihkanUpload, simpanGambar } from "../../../../lib/upload";
import { beritaSchema, dariForm, galatZod, type FormState } from "../../../../lib/validasi";
import { requireAdmin } from "../../../../lib/session";

const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};

export async function simpanBerita(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireAdmin("berita", "/admin/berita");
  const id = idDari(fd);
  const ada = id ? await db().post.findUnique({ where: { id } }) : null;
  if (id && !ada) return { ok: false, pesan: "Tulisan tidak ditemukan (mungkin sudah dihapus)." };

  const p = beritaSchema.safeParse(dariForm(fd));
  if (!p.success) return galatZod(p.error, dariForm(fd));
  const d = p.data;

  // Gambar: unggahan baru menggantikan; centang "hapus" mengosongkan.
  let image = ada?.image ?? "";
  const file = fd.get("gambar");
  if (file instanceof File && file.size > 0) {
    const h = await simpanGambar(file);
    if (!h.ok)
      return {
        ok: false,
        pesan: "Periksa kembali isian Anda.",
        errors: { gambar: h.pesan },
        values: dariForm(fd),
      };
    image = h.path;
  } else if (fd.get("hapusGambar") === "on") {
    image = "";
  }

  const sekarang = new Date();
  const published = d.published;
  const publishedAt = published ? (d.publishedAt ?? ada?.publishedAt ?? sekarang) : null;
  const data = {
    kind: d.kind,
    title: d.title,
    excerpt: d.excerpt,
    body: d.body,
    image,
    published,
    publishedAt,
  };
  if (ada) {
    await db().post.update({ where: { id: ada.id }, data });
    if (ada.image !== image) await bersihkanUpload(ada.image);
  } else {
    const slug = await slugPostUnik(slugify(d.title));
    await db().post.create({ data: { ...data, slug, authorId: user.id } });
  }
  redirect("/admin/berita?ok=tersimpan");
}

export async function hapusBerita(fd: FormData): Promise<void> {
  await requireAdmin("berita", "/admin/berita");
  const id = idDari(fd);
  if (!id) redirect("/admin/berita");
  const ada = await db().post.findUnique({ where: { id } });
  if (ada) {
    await db().post.delete({ where: { id } });
    await bersihkanUpload(ada.image);
  }
  redirect("/admin/berita?ok=dihapus");
}

export async function ubahStatusBerita(fd: FormData): Promise<void> {
  await requireAdmin("berita", "/admin/berita");
  const id = idDari(fd);
  const ada = id ? await db().post.findUnique({ where: { id } }) : null;
  if (ada) {
    const terbitkan = !ada.published;
    await db().post.update({
      where: { id: ada.id },
      data: {
        published: terbitkan,
        publishedAt: terbitkan ? (ada.publishedAt ?? new Date()) : null,
      },
    });
  }
  redirect("/admin/berita?ok=tersimpan");
}
