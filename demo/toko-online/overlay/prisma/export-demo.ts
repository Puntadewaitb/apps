// OVERLAY sample statis: ekspor data seed (katalog, pengaturan, voucher) ke lib/demo-data.json. Dijalankan saat build,
// setelah seed, oleh demo/toko-online/config.mjs. Data inilah "backend" simulasi di peramban (lib/demo-toko.ts).
// Dijalankan langsung oleh Node (type stripping): hanya sintaks TypeScript yang bisa dihapus.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "../generated/prisma/client.ts";

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

try {
  const [produk, kategori, setting, voucher] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        variants: { where: { active: true }, orderBy: { id: "asc" } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.category.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      select: { id: true, slug: true, name: true },
    }),
    prisma.setting.findMany(),
    prisma.voucher.findMany({ orderBy: { id: "asc" } }),
  ]);
  writeFileSync("lib/demo-data.json", JSON.stringify({ produk, kategori, setting, voucher }));
  console.log(
    `[export-demo] produk:${produk.length} kategori:${kategori.length} setting:${setting.length} voucher:${voucher.length}`,
  );
} finally {
  await prisma.$disconnect();
}
