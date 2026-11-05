// OVERLAY sample statis: pengganti server action daftarPpdb/cekStatusPpdb — TIDAK ada server. Pendaftaran hanya
// disimpan di localStorage peramban pengunjung. Validasi memakai skema & pemeriksa berkas yang SAMA dengan versi
// lengkap (zod, magic bytes), jadi aturan & pesan galat identik.
import { HONEYPOT_FIELD, randomCode, validateUpload } from "@tpl/core";
import type { HasilDaftar, HasilStatus } from "../app/(publik)/ppdb/actions";
import { DOKUMEN_KINDS, ppdb } from "../content/ppdb";
import { pendaftaranSchema } from "./ppdb-schema";
import { dariForm, galatZod } from "./validasi";

const KEY = "demo:sekolah:ppdb";
const MAKS = 2 * 1024 * 1024;
const PESAN_BERKAS: Record<string, string> = {
  empty: "Berkas kosong.",
  too_large: "Ukuran berkas maksimal 2 MB.",
  type_not_allowed: "Format berkas harus PDF, PNG, JPG, atau WebP.",
  type_mismatch: "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
};

type Rec = {
  regNo: string;
  token: string; // kanonik (tanpa tanda hubung); hanya untuk simulasi di peramban sendiri
  status: string;
  adminNote: string;
  studentName: string;
  targetGrade: string;
  createdAt: string;
  dokumen: string[];
};

/** Pendaftaran contoh agar pengunjung bisa mencoba "Cek Status" tanpa mendaftar dulu. */
export const CONTOH = {
  nomor: "PPDB-2027-K7M2XQ",
  token: "ABCD-EFGH-JKMN",
} as const;
const SEED: Rec = {
  regNo: CONTOH.nomor,
  token: "ABCDEFGHJKMN",
  status: "DIPROSES",
  adminNote: "Berkas lengkap. Jadwal tes dan wawancara akan diumumkan melalui WhatsApp orang tua.",
  studentName: "Calon Siswa Contoh",
  targetGrade: ppdb.jenjang[0] ?? "",
  createdAt: "2026-11-01T03:00:00.000Z",
  dokumen: ["akta", "kk", "rapor"],
};

const baca = (): Rec[] => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Rec[];
  } catch {
    return [];
  }
};
const tulis = (r: Rec[]) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* penyimpanan diblokir: tetap sukses (hanya simulasi) */
  }
};

export async function daftarPpdbDemo(_prev: HasilDaftar, fd: FormData): Promise<HasilDaftar> {
  if (!ppdb.dibuka) return { ok: false, pesan: "Pendaftaran sedang ditutup." };
  const token = () => randomCode(12).replace(/(.{4})(?=.)/g, "$1-");
  const nomor = () => `PPDB-${new Date().getFullYear()}-${randomCode(6)}`;
  if (String(fd.get(HONEYPOT_FIELD) ?? "").trim() !== "")
    return { ok: true, regNo: nomor(), token: token() };

  const nilai = dariForm(fd);
  const p = pendaftaranSchema.safeParse(nilai);
  const galat: Record<string, string> = p.success ? {} : (galatZod(p.error).errors ?? {});

  const dokumen: string[] = [];
  for (const d of ppdb.dokumen) {
    const f = fd.get(`dok_${d.kind}`);
    if (f instanceof File && f.size > 0) {
      const cek = validateUpload(new Uint8Array(await f.arrayBuffer()), {
        maxBytes: MAKS,
        allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
        declaredType: f.type || undefined,
      });
      if (cek.ok) dokumen.push(d.kind);
      else galat[`dok_${d.kind}`] = PESAN_BERKAS[cek.reason] ?? "Berkas tidak valid.";
    } else if (d.wajib) {
      galat[`dok_${d.kind}`] = "Dokumen ini wajib diunggah.";
    }
  }
  if (!p.success || Object.keys(galat).length > 0)
    return { ok: false, pesan: "Periksa kembali isian Anda.", errors: galat, values: nilai };

  const t = token();
  const regNo = nomor();
  tulis([
    ...baca(),
    {
      regNo,
      token: t.replaceAll("-", ""),
      status: "BARU",
      adminNote: "",
      studentName: p.data.studentName,
      targetGrade: p.data.targetGrade,
      createdAt: new Date().toISOString(),
      // urutan sama dengan DOKUMEN_KINDS
      dokumen: DOKUMEN_KINDS.filter((k) => dokumen.includes(k)),
    },
  ]);
  return { ok: true, regNo, token: t };
}

const NOMOR_RE = /^PPDB-\d{4}-[2-9A-HJKMNP-Z]{6}$/;
const TOKEN_RE = /^[2-9A-HJKMNP-Z]{12}$/;

export async function cekStatusPpdbDemo(_prev: HasilStatus, fd: FormData): Promise<HasilStatus> {
  const nomor = String(fd.get("nomor") ?? "")
    .trim()
    .toUpperCase();
  const token = String(fd.get("token") ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "");
  if (!NOMOR_RE.test(nomor) || !TOKEN_RE.test(token))
    return {
      ok: false,
      pesan:
        "Format nomor pendaftaran atau token tidak sesuai. Contoh: PPDB-2027-K7M2XQ dan ABCD-EFGH-JKMN.",
    };
  // Nomor tak dikenal & token salah → pesan identik (sama dengan versi lengkap).
  const r = [SEED, ...baca()].find((x) => x.regNo === nomor && x.token === token);
  if (!r) return { ok: false, pesan: "Nomor pendaftaran atau token tidak cocok." };
  return {
    ok: true,
    data: {
      regNo: r.regNo,
      status: r.status,
      adminNote: r.adminNote,
      studentName: r.studentName,
      targetGrade: r.targetGrade,
      createdAt: r.createdAt,
      dokumen: r.dokumen,
    },
  };
}
