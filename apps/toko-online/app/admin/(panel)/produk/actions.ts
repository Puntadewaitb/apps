"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { slugUnik, slugify } from "../../../../lib/slug";
import {
  bersihkanUpload,
  periksaGambar,
  tulisGambar,
  type GambarSiap,
} from "../../../../lib/upload";
import { galeriProduk } from "../../../../lib/katalog";
import {
  MAKS_GALERI,
  bacaVarian,
  dariForm,
  galatZod,
  produkSchema,
  type FormState,
} from "../../../../lib/validasi";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { PATH_UPLOAD } from "../../../../lib/upload";
import { uploadDir } from "../../../../lib/env";

const PLACEHOLDER = "/img/produk-placeholder.svg";
const idDari = (fd: FormData) => {
  const v = String(fd.get("id") ?? "");
  return /^\d{1,9}$/.test(v) ? Number(v) : undefined;
};
const berkas = (v: FormDataEntryValue | null): File[] =>
  v instanceof File && v.size > 0 ? [v] : [];

async function hapusBerkasBaru(paths: string[]) {
  for (const p of paths) {
    const m = PATH_UPLOAD.exec(p);
    if (m) await rm(join(uploadDir(), m[1]!), { force: true });
  }
}

export async function simpanProduk(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("produk", "/admin/produk");
  const id = idDari(fd);
  const ada = id
    ? await db().product.findUnique({ where: { id }, include: { variants: true } })
    : null;
  if (id && !ada) return { ok: false, pesan: "Produk tidak ditemukan (mungkin sudah dihapus)." };
  const f = dariForm(fd);

  const p = produkSchema.safeParse(f);
  const { varian, errors: ev } = bacaVarian(f);
  const errors: Record<string, string> = { ...ev };
  if (!p.success) for (const i of p.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
  if (
    p.success &&
    !(await db().category.findUnique({ where: { id: p.data.categoryId }, select: { id: true } }))
  )
    errors.categoryId = "Kategori tidak ditemukan.";

  // Varian yang dikirim dengan id harus milik produk ini (id dari produk lain/fiktif ditolak).
  const milikIni = new Set(ada?.variants.map((v) => v.id) ?? []);
  varian.forEach((v, i) => {
    if (v.id !== undefined && !milikIni.has(v.id))
      errors[`v${i}_name`] = "Varian tidak valid. Muat ulang halaman.";
  });
  // SKU harus unik di seluruh toko.
  if (varian.length) {
    const sama = await db().variant.findMany({
      where: { sku: { in: varian.map((v) => v.sku) } },
      select: { id: true, sku: true },
    });
    varian.forEach((v, i) => {
      if (sama.some((s) => s.sku === v.sku && s.id !== v.id))
        errors[`v${i}_sku`] = "SKU sudah dipakai varian lain.";
    });
  }

  // Berkas: periksa SEMUA dulu (atomik) sebelum ada yang ditulis.
  const utama = berkas(fd.get("gambar"));
  const galeriBaru = fd.getAll("galeri").flatMap((x) => berkas(x));
  const lama = ada ? galeriProduk(PLACEHOLDER, ada.images).slice(1) : []; // tambahan saja (placeholder = penanda posisi utama)
  const hapusGaleri = new Set(fd.getAll("hapusGaleri").map(String));
  const dipertahankan = lama.filter((g) => !hapusGaleri.has(g));
  if (dipertahankan.length + galeriBaru.length > MAKS_GALERI)
    errors.galeri = `Maksimal ${MAKS_GALERI} gambar tambahan.`;
  const siapUtama: GambarSiap[] = [];
  const siapGaleri: GambarSiap[] = [];
  for (const [daftar, tujuan, kunci] of [
    [utama, siapUtama, "gambar"],
    [galeriBaru, siapGaleri, "galeri"],
  ] as const)
    for (const file of daftar) {
      const c = await periksaGambar(file);
      if (!c.ok) errors[kunci] ??= `${file.name || "Berkas"}: ${c.pesan}`;
      else tujuan.push(c.gambar);
    }
  if (Object.keys(errors).length || !p.success)
    return galatZod(
      { issues: Object.entries(errors).map(([k, message]) => ({ path: [k], message })) },
      f,
    );

  const ditulis: string[] = [];
  try {
    const gambarUtama = siapUtama[0] ? await tulisGambar(siapUtama[0]) : null;
    if (gambarUtama) ditulis.push(gambarUtama);
    const tambahan: string[] = [];
    for (const g of siapGaleri) {
      const path = await tulisGambar(g);
      ditulis.push(path);
      tambahan.push(path);
    }
    const image = gambarUtama ?? ada?.image ?? PLACEHOLDER;
    const images = JSON.stringify([...dipertahankan, ...tambahan]);
    const slug =
      ada?.slug ??
      (await slugUnik(
        slugify(p.data.name),
        async (s) =>
          !!(await db().product.findUnique({ where: { slug: s }, select: { id: true } })),
      ));
    const data = {
      name: p.data.name,
      description: p.data.description,
      categoryId: p.data.categoryId,
      price: p.data.price,
      active: p.data.active,
      image,
      images,
    };

    await db().$transaction(async (tx) => {
      const produk = ada
        ? await tx.product.update({ where: { id: ada.id }, data })
        : await tx.product.create({ data: { ...data, slug } });
      if (ada) {
        const dikirim = new Set(varian.flatMap((v) => (v.id !== undefined ? [v.id] : [])));
        await tx.variant.deleteMany({ where: { productId: ada.id, id: { notIn: [...dikirim] } } });
      }
      for (const v of varian) {
        if (v.id !== undefined)
          // Stok varian yang ada TIDAK diubah dari sini (dikelola di halaman Stok; menghindari menimpa pesanan yang masuk).
          await tx.variant.update({
            where: { id: v.id },
            data: { name: v.name, sku: v.sku, price: v.price, active: v.active },
          });
        else
          await tx.variant.create({
            data: {
              productId: produk.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              active: v.active,
            },
          });
      }
    });
    // Setelah commit: bersihkan berkas lama yang tak dirujuk lagi.
    if (ada) {
      if (gambarUtama && ada.image !== gambarUtama) await bersihkanUpload(ada.image);
      for (const g of lama.filter((x) => hapusGaleri.has(x))) await bersihkanUpload(g);
    }
  } catch (e) {
    await hapusBerkasBaru(ditulis);
    if (typeof e === "object" && e && (e as { code?: string }).code === "P2002")
      return {
        ok: false,
        pesan: "SKU atau slug bentrok dengan data lain. Coba lagi.",
        values: f,
        errors: { varian: "SKU sudah dipakai." },
      };
    throw e;
  }
  redirect("/admin/produk?ok=tersimpan");
}

export async function ubahAktif(fd: FormData): Promise<void> {
  await requireAdmin("produk", "/admin/produk");
  const id = idDari(fd);
  const ada = id
    ? await db().product.findUnique({ where: { id }, select: { id: true, active: true } })
    : null;
  if (ada) await db().product.update({ where: { id: ada.id }, data: { active: !ada.active } });
  redirect("/admin/produk?ok=aktif");
}

export async function hapusProduk(fd: FormData): Promise<void> {
  await requireAdmin("produk", "/admin/produk");
  const id = idDari(fd);
  const ada = id ? await db().product.findUnique({ where: { id } }) : null;
  if (ada) {
    // OrderItem.productId/variantId → SetNull; riwayat pesanan tetap utuh lewat snapshot nama & harga.
    await db().product.delete({ where: { id: ada.id } });
    for (const g of galeriProduk(ada.image, ada.images)) await bersihkanUpload(g);
  }
  redirect("/admin/produk?ok=dihapus");
}
