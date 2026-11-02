// Database khusus e2e (bersih tiap run): hapus → generate → migrate deploy → seed.
import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

for (const f of ["e2e.db", "e2e.db-journal"]) rmSync(f, { force: true });
execSync("npx prisma generate && npx prisma migrate deploy && node prisma/seed.ts", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: "file:./e2e.db" },
});
