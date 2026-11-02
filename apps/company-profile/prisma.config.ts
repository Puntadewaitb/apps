import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Default dev; ganti lewat DATABASE_URL (lihat .env.example).
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
