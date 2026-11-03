"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { MAKS_ONGKIR, bacaKota, bacaRekening, tokoSchema } from "../../../../lib/pengaturan-schema";
import { requireAdmin } from "../../../../lib/session";
import { getPengaturan } from "../../../../lib/setting";
import { bersihkanUpload, periksaGambar, tulisGambar } from "../../../../lib/upload";
import { dariForm, galatZod, type FormState } from "../../../../lib/validasi";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { uploadDir } from "../../../../lib/env";
import { PATH_UPLOAD } from "../../../../lib/upload";

/** Simpan pengaturan toko (HANYA ADMIN). Semua nilai divalidasi ulang di server; JSON dibangun dari data tervalidasi. */
export async function simpanPengaturan(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("pengaturan", "/admin/pengaturan");
  const f = dariForm(fd);
  const t = tokoSchema.safeParse({
    nama: f.nama ?? "",
    tagline: f.tagline ?? "",
    alamat: f.alamat ?? "",
    catatanBayar: f.catatanBayar ?? "",
    whatsapp: f.whatsapp ?? "",
    ongkirBawaan: f.ongkirBawaan ?? "",
  });
  const rk = bacaRekening(f);
  const kt = bacaKota(f);
  const errors: Record<string, string> = { ...rk.errors, ...kt.errors };
  if (!t.success) for (const i of t.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;

  const berkas = fd.get("qris");
  let qrisBaru: Awaited<ReturnType<typeof periksaGambar>> | null = null;
  if (berkas instanceof File && berkas.size > 0) {
    qrisBaru = await periksaGambar(berkas);
    if (!qrisBaru.ok) errors.qris = qrisBaru.pesan;
  }
  if (Object.keys(errors).length || !t.success)
    return galatZod(
      { issues: Object.entries(errors).map(([k, message]) => ({ path: [k], message })) },
      f,
    );

  const lama = (await getPengaturan()).qris;
  let path: string | null = null;
  try {
    if (qrisBaru?.ok) path = await tulisGambar(qrisBaru.gambar);
    const qris = path ?? (f.hapusQris === "on" ? "" : lama);
    const nilai: Record<string, string> = {
      "toko.nama": t.data.nama,
      "toko.tagline": t.data.tagline,
      "toko.whatsapp": t.data.whatsapp,
      "toko.alamat": t.data.alamat,
      "toko.catatanBayar": t.data.catatanBayar,
      "toko.rekening": JSON.stringify(rk.rekening),
      "toko.ongkir": JSON.stringify({
        bawaan: Math.min(t.data.ongkirBawaan, MAKS_ONGKIR),
        kota: kt.kota,
      }),
      "toko.qris": qris,
    };
    await db().$transaction(
      Object.entries(nilai).map(([key, value]) =>
        db().setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );
    if (lama && lama !== qris) await bersihkanUpload(lama);
  } catch (e) {
    if (path) {
      const m = PATH_UPLOAD.exec(path);
      if (m) await rm(join(uploadDir(), m[1]!), { force: true });
    }
    throw e;
  }
  redirect("/admin/pengaturan?ok=pengaturan");
}
