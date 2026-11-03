import {
  bacaBadan,
  galat,
  ipKlien,
  jawab,
  periksaAsal,
  tolakMetode,
} from "../../../../lib/api-guard";
import { db } from "../../../../lib/db";
import { hapusBukti, MAKS_BUKTI, periksaBukti, simpanBukti } from "../../../../lib/bukti";
import { bolehUnggahBukti, normalisasiKodePesanan } from "../../../../lib/lacak";
import { cariPesananMilik } from "../../../../lib/lacak-server";
import { limiters } from "../../../../lib/limiters";

const PESAN_TAK_COCOK = "Kode pesanan atau nomor HP tidak cocok.";
// Badan multipart = berkas (≤ 2 MB) + beberapa field; beri ruang untuk pembungkus.
const MAKS_BADAN = MAKS_BUKTI + 16 * 1024;

/** POST multipart { kode, telepon, berkas } → simpan bukti bayar. Wajib kode + HP cocok; hanya saat MENUNGGU_BAYAR. */
export async function POST(req: Request) {
  const asal = periksaAsal(req);
  if (asal) return asal;
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().startsWith("multipart/form-data"))
    return galat(415, "Content-Type harus multipart/form-data.");
  const l = limiters();
  const ip = l.buktiIp.check(ipKlien(req));
  if (!ip.allowed)
    return galat(
      429,
      "Terlalu banyak unggahan dari jaringan Anda. Coba lagi nanti.",
      {},
      { "Retry-After": String(ip.retryAfterSec) },
    );

  const badan = await bacaBadan(req, MAKS_BADAN);
  if ("res" in badan) return badan.res;
  let fd: FormData;
  try {
    fd = await new Response(badan.buf as BodyInit, { headers: { "content-type": ct } }).formData();
  } catch {
    return galat(400, "Formulir tidak valid.");
  }
  const kodeIsi = String(fd.get("kode") ?? "");
  const hpIsi = String(fd.get("telepon") ?? "");
  const berkas = fd.get("berkas");

  const kd = l.buktiKode.check(normalisasiKodePesanan(kodeIsi) || "tidak-sah");
  if (!kd.allowed)
    return galat(
      429,
      "Terlalu banyak unggahan untuk pesanan ini. Coba lagi nanti.",
      {},
      { "Retry-After": String(kd.retryAfterSec) },
    );

  const order = await cariPesananMilik(kodeIsi, hpIsi);
  if (!order) return galat(404, PESAN_TAK_COCOK);
  if (!bolehUnggahBukti(order.status))
    return galat(409, "Bukti bayar hanya bisa diunggah saat pesanan menunggu pembayaran.");
  if (!(berkas instanceof File)) return galat(400, "Pilih berkas bukti bayar.");

  const cek = periksaBukti(new Uint8Array(await berkas.arrayBuffer()), berkas.type);
  if (!cek.ok) return galat(422, cek.pesan);

  const nama = await simpanBukti(cek.bukti);
  try {
    // Hanya menimpa bila status MASIH menunggu bayar (cegah balapan dengan admin yang baru mengubah status).
    const lama = order.paymentProof;
    const u = await db().order.updateMany({
      where: { id: order.id, status: "MENUNGGU_BAYAR" },
      data: { paymentProof: nama },
    });
    if (u.count !== 1) {
      await hapusBukti(nama);
      return galat(409, "Status pesanan baru saja berubah. Muat ulang halaman.");
    }
    if (lama) await hapusBukti(lama);
  } catch (e) {
    await hapusBukti(nama);
    throw e;
  }
  return jawab(200, { ok: true, buktiAda: true });
}

export const GET = () => tolakMetode();
