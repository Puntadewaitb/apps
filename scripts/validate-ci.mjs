// Validasi struktur .github/workflows/ci.yml tanpa menunggu GitHub. Jalankan: npm run ci:validate
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const file = new URL("../.github/workflows/ci.yml", import.meta.url);
const doc = parse(readFileSync(file, "utf8"));
const errors = [];
const need = (cond, msg) => cond || errors.push(msg);

need(doc && typeof doc === "object", "YAML kosong/tidak valid");
const on = doc.on ?? doc[true]; // YAML 1.1 bisa membaca `on` sebagai true
need(on?.push?.branches?.includes("main"), "push ke main belum ada");
need(on?.push?.branches?.includes("claude/**"), "push ke claude/** belum ada");
need(on && "pull_request" in on, "trigger pull_request belum ada");

const jobs = doc.jobs ?? {};
need(jobs.check && jobs.app, "job `check` dan `app` wajib ada");
const apps = jobs.app?.strategy?.matrix?.app ?? [];
for (const a of ["landing-page", "company-profile", "undangan", "sekolah", "toko-online"]) {
  need(apps.includes(a), `matrix app belum memuat ${a}`);
}
for (const [name, job] of Object.entries(jobs)) {
  need(job["runs-on"], `job ${name}: runs-on kosong`);
  need(Array.isArray(job.steps) && job.steps.length > 0, `job ${name}: steps kosong`);
  for (const [i, s] of (job.steps ?? []).entries()) {
    need(s.uses || s.run, `job ${name}: step #${i + 1} tanpa uses/run`);
    if (s.uses) need(/@v?\d/.test(s.uses), `job ${name}: ${s.uses} tidak dipin versi`);
  }
}
const runs = Object.values(jobs).flatMap((j) => (j.steps ?? []).map((s) => s.run).filter(Boolean));
for (const cmd of [
  "npm ci",
  "npm run lint",
  "npm run typecheck",
  "npm run build",
  "npx playwright install --with-deps chromium",
]) {
  need(
    runs.some((r) => r.includes(cmd)),
    `perintah "${cmd}" tidak ditemukan`,
  );
}
need(
  !JSON.stringify(doc).includes("PW_CHROMIUM_PATH"),
  "PW_CHROMIUM_PATH tidak boleh di-set di CI",
);

// ---- pages.yml (sample statis GitHub Pages) ----
const pagesDoc = parse(
  readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
);
const pagesJobs = pagesDoc.jobs ?? {};
need(pagesJobs.build && pagesJobs.deploy, "pages.yml: job `build` dan `deploy` wajib ada");
for (const [name, job] of Object.entries(pagesJobs)) {
  need(job["runs-on"], `pages.yml job ${name}: runs-on kosong`);
  for (const s of job.steps ?? [])
    if (s.uses) need(/@v?\d/.test(s.uses), `pages.yml job ${name}: ${s.uses} tidak dipin versi`);
}
const pagesOn = pagesDoc.on ?? pagesDoc[true] ?? {};
need(
  "workflow_dispatch" in pagesOn && "schedule" in pagesOn,
  "pages.yml: butuh workflow_dispatch & schedule",
);
need(
  pagesJobs.deploy?.permissions?.pages === "write" &&
    pagesJobs.deploy?.permissions?.["id-token"] === "write",
  "pages.yml: job deploy butuh permissions pages:write dan id-token:write",
);
need(
  !pagesDoc.permissions ||
    (pagesDoc.permissions.pages !== "write" && pagesDoc.permissions["id-token"] !== "write"),
  "pages.yml: izin pages/id-token hanya boleh di level job deploy (least privilege)",
);
need(
  String(pagesJobs.deploy?.if ?? "").includes("refs/heads/main"),
  "pages.yml: deploy harus dibatasi ke branch main",
);
need(
  (pagesJobs.build?.steps ?? []).some((s) => String(s.run ?? "").includes("demo:verify")) &&
    (pagesJobs.build?.steps ?? []).some((s) => String(s.run ?? "").includes("demo:e2e")),
  "pages.yml: build harus menjalankan demo:verify dan demo:e2e sebelum publikasi",
);

if (errors.length) {
  console.error("ci.yml/pages.yml TIDAK valid:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(
  `ci.yml valid: ${Object.keys(jobs).length} job, ${runs.length} perintah run; pages.yml valid: ${Object.keys(pagesJobs).length} job`,
);
