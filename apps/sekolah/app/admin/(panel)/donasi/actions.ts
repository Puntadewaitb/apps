"use server";

import { redirect } from "next/navigation";
import { db } from "../../../../lib/db";
import { DONATION_STATUSES, isOneOf } from "../../../../lib/domain";
import { programSchema } from "../../../../lib/donasi-schema";
import { slugProgramUnik, slugify } from "../../../../lib/slug";
import { requireAdmin } from "../../../../lib/session";
import { bersihkanUpload, simpanGambar } from "../../../../lib/upload";
import { dariForm, galatZod, type FormState } from "../../../../lib/validasi";

const idDari = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^\d{1,9}$/.test(s) ? Number(s) : undefined;
};

/** Verifikasi / tolak / kembalikan ke menunggu. Progres program dihitung dari donasi TERVERIFIKASI, jadi otomatis ikut. */
export async function ubahStatusDonasi(fd: FormData): Promise<void> {
  await requireAdmin("donasi", "/admin/donasi");
  const id = idDari(fd.get("id"));
  const status = fd.get("status");
  if (!id || !isOneOf(DONATION_STATUSES, status)) redirect("/admin/donasi");
  const ada = await db().donation.findUnique({
    where: { id },
    select: { id: true, status: true, verifiedAt: true },
  });
  if (ada) {
    await db().donation.update({
      where: { id },
      data: {
        status,
        verifiedAt:
          status === "TERVERIFIKASI"
            ? ada.status === "TERVERIFIKASI"
              ? ada.verifiedAt
              : new Date()
            : null,
      },
    });
  }
  redirect(`/admin/donasi/${id}?ok=tersimpan`);
}

export async function simpanProgram(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin("donasi", "/admin/donasi/program");
  const id = idDari(fd.get("id"));
  const ada = id ? await db().donationProgram.findUnique({ where: { id } }) : null;
  if (id && !ada) return { ok: false, pesan: "Program tidak ditemukan." };
  const nilai = dariForm(fd);
  const p = programSchema.safeParse(nilai);
  if (!p.success) return galatZod(p.error, nilai);

  let image = ada?.image ?? "";
  const file = fd.get("gambar");
  if (file instanceof File && file.size > 0) {
    const h = await simpanGambar(file);
    if (!h.ok)
      return {
        ok: false,
        pesan: "Periksa kembali isian Anda.",
        errors: { gambar: h.pesan },
        values: nilai,
      };
    image = h.path;
  } else if (fd.get("hapusGambar") === "on") image = "";

  const d = p.data;
  const data = {
    title: d.title,
    description: d.description,
    target: d.target,
    deadline: d.deadline,
    active: d.active,
    image,
  };
  if (ada) {
    await db().donationProgram.update({ where: { id: ada.id }, data });
    if (ada.image !== image) await bersihkanUpload(ada.image);
  } else {
    await db().donationProgram.create({
      data: { ...data, slug: await slugProgramUnik(slugify(d.title, "program")) },
    });
  }
  redirect("/admin/donasi/program?ok=tersimpan");
}
