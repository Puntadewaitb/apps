"use server";

import { HONEYPOT_FIELD, getClientIp } from "@tpl/core";
import { headers } from "next/headers";
import { db } from "../../../lib/db";
import { programBySlug, terbukaUntukDonasi } from "../../../lib/donasi";
import { konfirmasiSchema } from "../../../lib/donasi-schema";
import { hapusDokumen, periksaDokumen, simpanDokumen } from "../../../lib/dokumen";
import { trustedProxies } from "../../../lib/env";
import { limiters } from "../../../lib/limiters";
import { dariForm, galatZod, type FormState } from "../../../lib/validasi";

export type HasilKonfirmasi = FormState;

export async function kirimKonfirmasi(
  _prev: HasilKonfirmasi,
  fd: FormData,
): Promise<HasilKonfirmasi> {
  // Honeypot terisi (bot): pura-pura sukses, tidak menyimpan apa pun.
  if (String(fd.get(HONEYPOT_FIELD) ?? "").trim() !== "") return { ok: true };

  const ip = getClientIp(await headers(), trustedProxies());
  if (!limiters().donasiIp.check(`donasi:${ip}`).allowed)
    return {
      ok: false,
      pesan: "Terlalu banyak percobaan dari jaringan Anda. Coba lagi beberapa saat lagi.",
    };

  const program = await programBySlug(String(fd.get("program") ?? ""));
  if (!program || !terbukaUntukDonasi(program))
    return { ok: false, pesan: "Program donasi ini tidak ditemukan atau sudah ditutup." };

  const nilai = dariForm(fd);
  const p = konfirmasiSchema.safeParse(nilai);
  const galat: Record<string, string> = p.success ? {} : (galatZod(p.error).errors ?? {});

  const f = fd.get("bukti");
  let bukti: Awaited<ReturnType<typeof periksaDokumen>> | null = null;
  if (f instanceof File && f.size > 0) {
    bukti = await periksaDokumen(f);
    if (!bukti.ok) galat.bukti = bukti.pesan;
  } else {
    galat.bukti = "Bukti transfer wajib diunggah.";
  }
  if (!p.success || Object.keys(galat).length > 0 || !bukti?.ok)
    return { ok: false, pesan: "Periksa kembali isian Anda.", errors: galat, values: nilai };

  let nama: string | null = null;
  try {
    nama = await simpanDokumen(bukti.dok);
    await db().donation.create({
      data: {
        programId: program.id,
        donorName: p.data.donorName,
        anonymous: p.data.anonymous,
        amount: p.data.amount,
        message: p.data.message,
        proofPath: nama,
        status: "MENUNGGU",
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("[donasi] gagal menyimpan konfirmasi", e);
    if (nama) await hapusDokumen(nama);
    return { ok: false, pesan: "Terjadi kesalahan di server. Coba lagi nanti.", values: nilai };
  }
}
