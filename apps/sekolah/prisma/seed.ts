// Seed demo (data FIKTIF). Idempotent & tidak menimpa: baris yang sudah ada (mis. sudah diedit admin) dibiarkan.
// Dijalankan langsung oleh Node (type stripping): hanya sintaks TypeScript yang bisa dihapus.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.ts";
import {
  agendas,
  daysFromNow,
  donations,
  galleries,
  posts,
  programs,
  teachers,
  users,
} from "./seed-data.ts";

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const MIN_PASSWORD = 12;
const now = new Date();

/** Password akun dari env; tidak ada password bawaan (cegah kredensial default yang terlupa diganti). */
function passwordFor(email: string): string | undefined {
  const pw = email.startsWith("editor@") ? process.env.EDITOR_PASSWORD : process.env.ADMIN_PASSWORD;
  if (!pw) return undefined;
  if (pw.length < MIN_PASSWORD) {
    throw new Error(`Password untuk ${email} minimal ${MIN_PASSWORD} karakter.`);
  }
  return pw;
}

try {
  // --- User ---
  const adminEmail = process.env.ADMIN_EMAIL || users[0]!.email;
  const userIds = new Map<string, number>();
  for (const u of users) {
    const email = u.role === "ADMIN" ? adminEmail : u.email;
    const pw = passwordFor(u.role === "ADMIN" ? "admin@" : "editor@");
    if (!pw) {
      console.warn(`[seed] ${u.role}: password env tidak diisi → akun ${email} TIDAK dibuat.`);
      continue;
    }
    const row = await prisma.user.upsert({
      where: { email },
      create: { email, name: u.name, role: u.role, passwordHash: await bcrypt.hash(pw, 12) },
      update: {}, // jangan menimpa password/nama yang sudah diubah
    });
    userIds.set(u.role, row.id);
  }

  // --- Guru ---
  for (const t of teachers) {
    await prisma.teacher.upsert({ where: { id: t.id }, create: t, update: {} });
  }

  // --- Berita & pengumuman ---
  for (const p of posts) {
    const { daysAgo, ...rest } = p;
    const published = daysAgo !== null;
    await prisma.post.upsert({
      where: { slug: p.slug },
      create: {
        ...rest,
        published,
        publishedAt: published ? daysFromNow(now, -daysAgo, 8) : null,
        authorId: userIds.get("ADMIN") ?? null,
      },
      update: {},
    });
  }

  // --- Agenda ---
  for (const a of agendas) {
    const { startDay, startHour, endDay, endHour, ...rest } = a;
    await prisma.agenda.upsert({
      where: { id: a.id },
      create: {
        ...rest,
        startsAt: daysFromNow(now, startDay, startHour),
        endsAt: endDay === null ? null : daysFromNow(now, endDay, endHour ?? 23),
      },
      update: {},
    });
  }

  // --- Galeri (gambar hanya dibuat bersama album baru) ---
  for (const g of galleries) {
    const ada = await prisma.gallery.findUnique({ where: { slug: g.slug } });
    if (ada) continue;
    const { images, ...album } = g;
    await prisma.gallery.create({
      data: { ...album, images: { create: images.map((im, i) => ({ ...im, sort: i + 1 })) } },
    });
  }

  // --- Program donasi + donasi demo (donasi hanya dibuat untuk program yang baru) ---
  for (const pr of programs) {
    const ada = await prisma.donationProgram.findUnique({ where: { slug: pr.slug } });
    if (ada) continue;
    const { deadlineDays, ...rest } = pr;
    const row = await prisma.donationProgram.create({
      data: {
        ...rest,
        deadline: deadlineDays === null ? null : daysFromNow(now, deadlineDays, 23, 59),
      },
    });
    const demo = donations.filter((d) => d.program === pr.slug);
    for (const d of demo) {
      await prisma.donation.create({
        data: {
          programId: row.id,
          donorName: d.donorName,
          anonymous: d.anonymous,
          amount: d.amount,
          message: d.message,
          status: d.status,
          verifiedAt: d.status === "TERVERIFIKASI" ? new Date() : null,
        },
      });
    }
  }

  const [nUser, nPost, nTeacher, nAgenda, nGallery, nProgram, nDonation] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.teacher.count(),
    prisma.agenda.count(),
    prisma.gallery.count(),
    prisma.donationProgram.count(),
    prisma.donation.count(),
  ]);
  console.log(
    `[seed] OK — user:${nUser} post:${nPost} guru:${nTeacher} agenda:${nAgenda} galeri:${nGallery} program:${nProgram} donasi:${nDonation}`,
  );
} finally {
  await prisma.$disconnect();
}
