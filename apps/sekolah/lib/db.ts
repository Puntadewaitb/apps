import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { databaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl() }) });
}

/** Satu instance per proses (aman terhadap HMR). */
export function db(): PrismaClient {
  globalForPrisma.prisma ??= create();
  return globalForPrisma.prisma;
}
