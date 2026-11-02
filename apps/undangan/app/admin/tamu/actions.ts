"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { getActiveEvent } from "../../../lib/event";
import { buatKodeTamu, parseDaftarTamu } from "../../../lib/tamu";

export type TambahState = {
  ok: boolean;
  pesan: string;
  galat: Array<{ baris: number; pesan: string }>;
};

/** Tambah tamu massal dari textarea. Atomik: bila ada baris salah, tidak ada yang disimpan. */
export async function tambahTamu(_prev: TambahState, formData: FormData): Promise<TambahState> {
  await requireAdmin();
  const teks = formData.get("daftar");
  if (typeof teks !== "string" || teks.length > 20_000) {
    return { ok: false, pesan: "Data tidak valid.", galat: [] };
  }
  const ev = await getActiveEvent();
  if (!ev) return { ok: false, pesan: "Acara aktif tidak ditemukan.", galat: [] };

  const { valid, galat } = parseDaftarTamu(teks);
  if (galat.length > 0)
    return {
      ok: false,
      pesan: "Perbaiki baris berikut lalu kirim ulang. Tidak ada tamu yang disimpan.",
      galat,
    };
  if (valid.length === 0) return { ok: false, pesan: "Daftar kosong.", galat: [] };

  await db().$transaction(async (tx) => {
    for (const t of valid) {
      // Kode unik; tabrakan sangat jarang, coba ulang beberapa kali.
      for (let i = 0; i < 5; i++) {
        try {
          await tx.guest.create({
            data: {
              eventId: ev.id,
              name: t.name,
              maxPax: t.maxPax,
              phone: t.phone,
              code: buatKodeTamu(),
            },
          });
          break;
        } catch (err) {
          if (i === 4) throw err;
        }
      }
    }
  });
  revalidatePath("/admin/tamu");
  revalidatePath("/admin");
  return { ok: true, pesan: `${valid.length} tamu ditambahkan.`, galat: [] };
}

export async function hapusTamu(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const ev = await getActiveEvent();
  if (!ev) return;
  await db().guest.deleteMany({ where: { id, eventId: ev.id } });
  revalidatePath("/admin/tamu");
  revalidatePath("/admin");
}
