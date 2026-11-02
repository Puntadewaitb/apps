// Seed demo: 1 acara pernikahan FIKTIF. Idempotent (aman dijalankan berulang).
// Dijalankan langsung oleh Node (type stripping): hanya sintaks TypeScript yang bisa dihapus.
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

export const DEMO_SLUG = "raka-anisa";

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const event = {
  slug: DEMO_SLUG,
  title: "Pernikahan Raka & Anisa",
  groomName: "Raka Pratama",
  brideName: "Anisa Putri",
  groomParents: "Putra dari Bapak Hendra Pratama & Ibu Sari Wulandari",
  brideParents: "Putri dari Bapak Darmawan Saputra & Ibu Lestari Ningsih",
  akadAt: new Date("2027-02-20T08:00:00+07:00"),
  resepsiAt: new Date("2027-02-20T11:00:00+07:00"),
  venueName: "Gedung Serbaguna Melati",
  venueAddress: "Jl. Melati Raya No. 12, Yogyakarta (alamat fiktif untuk demo)",
  resepsiVenueName: "Balai Pertemuan Kenanga",
  resepsiVenueAddress: "Jl. Kenanga No. 8, Yogyakarta (alamat fiktif untuk demo)",
  mapsUrl: "https://www.google.com/maps?q=Yogyakarta&output=embed",
  quote:
    "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan dari jenismu sendiri, agar kamu merasa tenteram kepadanya. (QS. Ar-Rum: 21)",
};

// Kode tetap agar seed idempotent; ganti/buat kode acak untuk tamu sungguhan.
const guests = [
  { code: "DEMO-0001", name: "Bapak Budi Santoso & Keluarga", maxPax: 4 },
  { code: "DEMO-0002", name: "Ibu Dewi Lestari", maxPax: 2 },
  { code: "DEMO-0003", name: "Sahabat Kampus", maxPax: 1 },
];

try {
  const ev = await prisma.event.upsert({
    where: { slug: event.slug },
    create: event,
    update: event,
  });

  for (const g of guests) {
    await prisma.guest.upsert({
      where: { code: g.code },
      create: { ...g, eventId: ev.id },
      update: { name: g.name, maxPax: g.maxPax },
    });
  }

  if ((await prisma.wish.count({ where: { eventId: ev.id } })) === 0) {
    await prisma.wish.createMany({
      data: [
        {
          eventId: ev.id,
          name: "Dewi Lestari",
          message: "Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah!",
        },
        {
          eventId: ev.id,
          name: "Budi Santoso",
          message: "Barakallah, semoga langgeng dan bahagia selalu.",
        },
      ],
    });
  }

  if ((await prisma.rsvp.count({ where: { eventId: ev.id } })) === 0) {
    const g = await prisma.guest.findUniqueOrThrow({ where: { code: "DEMO-0002" } });
    await prisma.rsvp.create({
      data: { eventId: ev.id, guestId: g.id, name: g.name, status: "HADIR", pax: 2 },
    });
  }

  console.log(`[seed] acara "${ev.title}" siap (slug: ${ev.slug}).`);
} finally {
  await prisma.$disconnect();
}
