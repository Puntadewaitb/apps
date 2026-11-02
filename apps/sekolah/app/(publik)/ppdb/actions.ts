"use server";

import { HONEYPOT_FIELD, getClientIp } from "@tpl/core";
import { headers } from "next/headers";
import { DOKUMEN_KINDS, ppdb } from "../../../content/ppdb";
import {
  hapusDokumen,
  parseDokumen,
  periksaDokumen,
  simpanDokumen,
  type DokumenSiap,
  type DokumenTersimpan,
} from "../../../lib/dokumen";
import { trustedProxies } from "../../../lib/env";
import { limiters } from "../../../lib/limiters";
import { cariRegistrasi, simpanPendaftaran } from "../../../lib/ppdb";
import { pendaftaranSchema } from "../../../lib/ppdb-schema";
import { buatNomor, buatToken, periksaStatus } from "../../../lib/ppdb-token";
import { dariForm, galatZod, type FormState } from "../../../lib/validasi";

export type HasilDaftar = FormState & { regNo?: string; token?: string };

const ipKlien = async () => getClientIp(await headers(), trustedProxies());

export async function daftarPpdb(_prev: HasilDaftar, fd: FormData): Promise<HasilDaftar> {
  if (!ppdb.dibuka) return { ok: false, pesan: "Pendaftaran sedang ditutup." };

  // Honeypot: bot mengisi kolom jebakan → pura-pura sukses (tidak disimpan, tidak ada berkas ditulis).
  if (String(fd.get(HONEYPOT_FIELD) ?? "").trim() !== "")
    return { ok: true, regNo: buatNomor(), token: buatToken() };

  if (!limiters().daftarIp.check(`daftar:${await ipKlien()}`).allowed)
    return {
      ok: false,
      pesan:
        "Terlalu banyak percobaan pendaftaran dari jaringan Anda. Coba lagi beberapa saat lagi.",
    };

  const nilai = dariForm(fd);
  const p = pendaftaranSchema.safeParse(nilai);
  const galat: Record<string, string> = p.success ? {} : (galatZod(p.error).errors ?? {});

  // Validasi SEMUA berkas dulu (belum menulis ke disk).
  const siap = new Map<string, DokumenSiap>();
  for (const d of ppdb.dokumen) {
    const f = fd.get(`dok_${d.kind}`);
    if (f instanceof File && f.size > 0) {
      const r = await periksaDokumen(f);
      if (r.ok) siap.set(d.kind, r.dok);
      else galat[`dok_${d.kind}`] = r.pesan;
    } else if (d.wajib) {
      galat[`dok_${d.kind}`] = "Dokumen ini wajib diunggah.";
    }
  }
  if (!p.success || Object.keys(galat).length > 0)
    return { ok: false, pesan: "Periksa kembali isian Anda.", errors: galat, values: nilai };

  // Tulis berkas; bila ada yang gagal/DB gagal, bersihkan semuanya (atomik).
  const tersimpan: DokumenTersimpan[] = [];
  try {
    for (const kind of DOKUMEN_KINDS) {
      const d = siap.get(kind);
      if (!d) continue;
      tersimpan.push({ kind, file: await simpanDokumen(d), mime: d.mime, size: d.size });
    }
    const { regNo, token } = await simpanPendaftaran(p.data, tersimpan);
    return { ok: true, regNo, token };
  } catch (e) {
    console.error("[ppdb] gagal menyimpan pendaftaran", e);
    for (const t of tersimpan) await hapusDokumen(t.file);
    return { ok: false, pesan: "Terjadi kesalahan di server. Coba lagi nanti.", values: nilai };
  }
}

export type HasilStatus = {
  ok?: boolean;
  pesan?: string;
  data?: {
    regNo: string;
    status: string;
    adminNote: string;
    studentName: string;
    targetGrade: string;
    createdAt: string;
    dokumen: string[];
  };
};

export async function cekStatusPpdb(_prev: HasilStatus, fd: FormData): Promise<HasilStatus> {
  const l = limiters();
  const hasil = await periksaStatus(
    String(fd.get("nomor") ?? ""),
    String(fd.get("token") ?? ""),
    await ipKlien(),
    {
      cari: cariRegistrasi,
      limiterIp: (k) => l.statusIp.check(k),
      limiterNomor: (k) => l.statusNomor.check(k),
    },
  );
  if (!hasil.ok) {
    const pesan = {
      FORMAT:
        "Format nomor pendaftaran atau token tidak sesuai. Contoh: PPDB-2027-K7M2XQ dan ABCD-EFGH-JKMN.",
      TIDAK_COCOK: "Nomor pendaftaran atau token tidak cocok.",
      RATE_LIMIT: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    }[hasil.galat];
    return { ok: false, pesan };
  }
  const r = hasil.data;
  return {
    ok: true,
    data: {
      regNo: r.regNo,
      status: r.status,
      adminNote: r.adminNote,
      studentName: r.studentName,
      targetGrade: r.targetGrade,
      createdAt: r.createdAt.toISOString(),
      dokumen: parseDokumen(r.documents).map((d) => d.kind),
    },
  };
}
