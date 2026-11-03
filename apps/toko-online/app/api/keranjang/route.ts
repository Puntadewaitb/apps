import { galat, ipKlien, jawab, bacaJson, tolakMetode } from "../../../lib/api-guard";
import { detailKeranjang, permintaanSchema } from "../../../lib/keranjang-server";
import { limiters } from "../../../lib/limiters";

/** POST { ids: number[] } → detail terkini (nama, harga, stok) varian di keranjang. Baca-saja; tidak mengubah data. */
export async function POST(req: Request) {
  const rl = limiters().keranjangIp.check(ipKlien(req));
  if (!rl.allowed)
    return galat(
      429,
      "Terlalu banyak permintaan. Coba lagi sebentar.",
      {},
      { "Retry-After": String(rl.retryAfterSec) },
    );
  const b = await bacaJson(req, 4096);
  if ("res" in b) return b.res;
  const p = permintaanSchema.safeParse(b.data);
  if (!p.success) return galat(400, "Permintaan tidak valid.");
  return jawab(200, { items: await detailKeranjang(p.data.ids) });
}

export const GET = () => tolakMetode();
