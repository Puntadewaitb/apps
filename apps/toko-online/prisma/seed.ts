// Seed demo (data FIKTIF). Idempotent & tidak menimpa: baris yang sudah ada (mis. sudah diedit admin) dibiarkan.
// Dijalankan langsung oleh Node (type stripping): hanya sintaks TypeScript yang bisa dihapus.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.ts";
import { categories, products, settings, users, vouchers } from "./seed-data.ts";

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
const MIN_PASSWORD = 12;
const DAY = 86_400_000;
const now = Date.now();

/** Password akun dari env; tidak ada password bawaan (cegah kredensial default yang terlupa diganti). */
function passwordFor(role: string): string | undefined {
  const pw = role === "ADMIN" ? process.env.ADMIN_PASSWORD : process.env.STAFF_PASSWORD;
  if (!pw) return undefined;
  if (pw.length < MIN_PASSWORD)
    throw new Error(`Password ${role} minimal ${MIN_PASSWORD} karakter.`);
  return pw;
}

try {
  // --- User ---
  for (const u of users) {
    const email = u.role === "ADMIN" ? process.env.ADMIN_EMAIL || u.email : u.email;
    const pw = passwordFor(u.role);
    if (!pw) {
      console.warn(`[seed] ${u.role}: password env tidak diisi → akun ${email} TIDAK dibuat.`);
      continue;
    }
    await prisma.user.upsert({
      where: { email },
      create: { email, name: u.name, role: u.role, passwordHash: await bcrypt.hash(pw, 12) },
      update: {},
    });
  }

  // --- Kategori ---
  const idKategori = new Map<string, number>();
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
    idKategori.set(c.slug, row.id);
  }

  // --- Produk + varian (varian hanya dibuat bersama produk baru) ---
  let n = 0;
  for (const p of products) {
    n++;
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.deskripsi,
        categoryId: idKategori.get(p.kategori)!,
        price: p.price,
        image: `/img/produk-${n}.svg`,
        variants: {
          create: p.varian.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price ?? null,
            stock: v.stock,
          })),
        },
      },
    });
  }

  // --- Voucher ---
  for (const v of vouchers) {
    const { hariMulai, hariSelesai, ...rest } = v;
    await prisma.voucher.upsert({
      where: { code: v.code },
      create: {
        ...rest,
        startsAt: new Date(now + hariMulai * DAY),
        endsAt: new Date(now + hariSelesai * DAY),
      },
      update: {},
    });
  }

  // --- Pengaturan ---
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: {} });
  }

  const [nUser, nKat, nProd, nVar, nVoucher, nSet] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.variant.count(),
    prisma.voucher.count(),
    prisma.setting.count(),
  ]);
  console.log(
    `[seed] OK — user:${nUser} kategori:${nKat} produk:${nProd} varian:${nVar} voucher:${nVoucher} pengaturan:${nSet}`,
  );
} finally {
  await prisma.$disconnect();
}
