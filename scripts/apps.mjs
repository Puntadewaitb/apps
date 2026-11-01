// Runner lintas-app. Men-skip app yang belum ada (belum punya package.json).
// Pakai:  node scripts/apps.mjs <dev|setup|build>
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const PORTS = {
  "landing-page": 3001,
  "company-profile": 3002,
  undangan: 3003,
  sekolah: 3004,
  "toko-online": 3005,
};

const appsDir = join(root, "apps");
const apps = existsSync(appsDir)
  ? readdirSync(appsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(appsDir, d.name, "package.json")))
      .map((d) => d.name)
      .sort((a, b) => (PORTS[a] ?? 9999) - (PORTS[b] ?? 9999))
  : [];

const cmd = process.argv[2];
const usage = "Pemakaian: node scripts/apps.mjs <dev|setup|build>";
if (!["dev", "setup", "build"].includes(cmd)) {
  console.error(usage);
  process.exit(2);
}

if (apps.length === 0) {
  console.log(`[${cmd}] belum ada app di apps/ — dilewati.`);
  process.exit(0);
}
console.log(`[${cmd}] app: ${apps.map((a) => `${a}${PORTS[a] ? `:${PORTS[a]}` : ""}`).join(", ")}`);

/** Jalankan script npm di satu app; app tanpa script tsb dilewati (--if-present). */
function runSync(script, app) {
  const r = spawnSync("npm", ["run", script, "--workspace", `apps/${app}`, "--if-present"], {
    cwd: root,
    stdio: "inherit",
  });
  return r.status ?? 1;
}

if (cmd === "dev") {
  // Paralel via concurrently; satu app mati → semua dimatikan.
  const bin = join(root, "node_modules", ".bin", "concurrently");
  const args = [
    "--kill-others-on-fail",
    "--names",
    apps.join(","),
    ...apps.map((a) => `npm run dev --workspace apps/${a}`),
  ];
  const child = spawn(bin, args, { cwd: root, stdio: "inherit" });
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  // setup / build: berurutan, berhenti di kegagalan pertama.
  for (const app of apps) {
    console.log(`\n=== ${cmd}: ${app} ===`);
    const status = runSync(cmd, app);
    if (status !== 0) {
      console.error(`\n[${cmd}] GAGAL di ${app} (exit ${status})`);
      process.exit(status);
    }
  }
}
