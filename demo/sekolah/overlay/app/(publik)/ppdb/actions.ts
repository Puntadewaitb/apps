// OVERLAY sample statis: di versi lengkap berkas ini adalah server action ("use server"). Di sini hanya TIPE yang
// dipakai komponen form; logika simulasinya ada di lib/demo-ppdb.ts (berjalan di peramban).
import type { FormState } from "../../../lib/validasi";

export type HasilDaftar = FormState & { regNo?: string; token?: string };

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
