import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node --env-file-if-exists=.env prisma/seed.ts" },
  datasource: {
    // Default dev; ganti lewat DATABASE_URL (lihat .env.example).
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
