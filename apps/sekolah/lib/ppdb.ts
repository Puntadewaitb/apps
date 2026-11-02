import { Prisma } from "../generated/prisma/client";
import { db } from "./db";
import type { Pendaftaran } from "./ppdb-schema";
import { buatNomor, buatToken, hashToken } from "./ppdb-token";
import type { DokumenTersimpan } from "./dokumen";

/**
 * Simpan pendaftaran. Nomor acak: bila bentrok (sangat jarang) coba lagi. Token polos dikembalikan SEKALI;
 * yang disimpan hanya hash SHA-256-nya.
 */
export async function simpanPendaftaran(data: Pendaftaran, dokumen: DokumenTersimpan[]) {
  const token = buatToken();
  for (let i = 0; i < 6; i++) {
    const regNo = buatNomor();
    try {
      await db().registration.create({
        data: {
          regNo,
          tokenHash: hashToken(token),
          studentName: data.studentName,
          birthPlace: data.birthPlace,
          birthDate: data.birthDate,
          gender: data.gender,
          previousSchool: data.previousSchool,
          address: data.address,
          targetGrade: data.targetGrade,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail,
          parentJob: data.parentJob,
          documents: JSON.stringify(dokumen),
        },
      });
      return { regNo, token };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // nomor bentrok
      throw e;
    }
  }
  throw new Error("Gagal membuat nomor pendaftaran unik.");
}

export const cariRegistrasi = (regNo: string) =>
  db().registration.findUnique({
    where: { regNo },
    select: {
      regNo: true,
      tokenHash: true,
      status: true,
      adminNote: true,
      studentName: true,
      targetGrade: true,
      createdAt: true,
      documents: true,
    },
  });
