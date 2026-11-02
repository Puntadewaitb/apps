"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { slugGaleriUnik, slugify } from "../../../../lib/slug";
import { requireAdmin } from "../../../../lib/session";
import { bersihkanUpload, simpanGambar } from "../../../../lib/upload";
import {
  albumSchema,
  dariForm,
  galatZod,
  keteranganSchema,
  type FormState,
} from "../../../../lib/validasi";

const ID = /^\d{1,9}$/;
const idDari = (fd: FormData, k = "id") => {
  const v = String(fd.get(k) ?? "");
  return ID.test(v) ? Number(v) : undefined;
};
const MAKS_FOTO_SEKALI = 10;

export async function simpanAlbum(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd);
  const ada = id ? await db().gallery.findUnique({ where: { id } }) : null;
  if (id && !ada) return { ok: false, pesan: "Album tidak ditemukan (mungkin sudah dihapus)." };
  const p = albumSchema.safeParse(dariForm(fd));
  if (!p.success) return galatZod(p.error, dariForm(fd));
  if (ada) {
    await db().gallery.update({ where: { id: ada.id }, data: p.data });
    redirect(`/admin/galeri/${ada.id}?ok=tersimpan`);
  }
  const slug = await slugGaleriUnik(slugify(p.data.title, "album"));
  const baru = await db().gallery.create({ data: { ...p.data, slug } });
  redirect(`/admin/galeri/${baru.id}?ok=tersimpan`);
}

export async function hapusAlbum(fd: FormData): Promise<void> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd);
  const ada = id
    ? await db().gallery.findUnique({ where: { id }, include: { images: true } })
    : null;
  if (ada) {
    await db().gallery.delete({ where: { id: ada.id } }); // GalleryImage ikut terhapus (cascade)
    for (const p of [ada.cover, ...ada.images.map((i) => i.src)]) await bersihkanUpload(p);
  }
  redirect("/admin/galeri?ok=dihapus");
}

export async function tambahFoto(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd);
  const album = id
    ? await db().gallery.findUnique({ where: { id }, select: { id: true, cover: true } })
    : null;
  if (!album) return { ok: false, pesan: "Album tidak ditemukan." };
  const files = fd.getAll("foto").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0)
    return {
      ok: false,
      pesan: "Pilih minimal satu foto.",
      errors: { foto: "Pilih minimal satu foto." },
    };
  if (files.length > MAKS_FOTO_SEKALI)
    return {
      ok: false,
      pesan: `Maksimal ${MAKS_FOTO_SEKALI} foto sekali unggah.`,
      errors: { foto: `Maksimal ${MAKS_FOTO_SEKALI} foto sekali unggah.` },
    };

  // Validasi SEMUA berkas dulu; satu saja tidak valid → tidak ada yang disimpan.
  const tersimpan: string[] = [];
  for (const f of files) {
    const h = await simpanGambar(f);
    if (!h.ok) {
      for (const p of tersimpan) await bersihkanUpload(p);
      return {
        ok: false,
        pesan: "Unggahan dibatalkan.",
        errors: { foto: `${f.name.slice(0, 60)}: ${h.pesan}` },
      };
    }
    tersimpan.push(h.path);
  }
  const maks = await db().galleryImage.aggregate({
    where: { galleryId: album.id },
    _max: { sort: true },
  });
  let urut = (maks._max.sort ?? 0) + 1;
  await db().galleryImage.createMany({
    data: tersimpan.map((src) => ({ galleryId: album.id, src, caption: "", sort: urut++ })),
  });
  if (!album.cover)
    await db().gallery.update({ where: { id: album.id }, data: { cover: tersimpan[0]! } });
  return { ok: true, pesan: `${tersimpan.length} foto ditambahkan.` };
}

export async function ubahKeterangan(fd: FormData): Promise<void> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd, "fotoId");
  const albumId = idDari(fd, "id");
  const k = keteranganSchema.safeParse(String(fd.get("caption") ?? ""));
  if (id && albumId && k.success)
    await db().galleryImage.updateMany({
      where: { id, galleryId: albumId },
      data: { caption: k.data },
    });
  redirect(`/admin/galeri/${albumId ?? ""}?ok=tersimpan`);
}

export async function jadikanCover(fd: FormData): Promise<void> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd, "fotoId");
  const albumId = idDari(fd, "id");
  const foto =
    id && albumId ? await db().galleryImage.findFirst({ where: { id, galleryId: albumId } }) : null;
  if (foto && albumId) {
    const lama = (
      await db().gallery.findUnique({ where: { id: albumId }, select: { cover: true } })
    )?.cover;
    await db().gallery.update({ where: { id: albumId }, data: { cover: foto.src } });
    await bersihkanUpload(lama && lama !== foto.src ? lama : null);
  }
  redirect(`/admin/galeri/${albumId ?? ""}?ok=tersimpan`);
}

export async function hapusFoto(fd: FormData): Promise<void> {
  await requireAdmin("galeri", "/admin/galeri");
  const id = idDari(fd, "fotoId");
  const albumId = idDari(fd, "id");
  const foto =
    id && albumId ? await db().galleryImage.findFirst({ where: { id, galleryId: albumId } }) : null;
  if (foto && albumId) {
    await db().galleryImage.delete({ where: { id: foto.id } });
    const album = await db().gallery.findUnique({
      where: { id: albumId },
      select: { cover: true },
    });
    if (album?.cover === foto.src) {
      const lain = await db().galleryImage.findFirst({
        where: { galleryId: albumId },
        orderBy: [{ sort: "asc" }, { id: "asc" }],
      });
      await db().gallery.update({ where: { id: albumId }, data: { cover: lain?.src ?? "" } });
    }
    await bersihkanUpload(foto.src);
  }
  redirect(`/admin/galeri/${albumId ?? ""}?ok=dihapus`);
}
