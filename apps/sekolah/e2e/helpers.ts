import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";

export const uniqueIp = () => {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
};
/** Huruf saja (a–p). */
export const huruf = () =>
  [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 16))).join("");
export const tag = (p = "t") => `${p}${randomBytes(4).toString("hex")}`;

/** Format DateTime yang dipakai Prisma + SQLite (teks ISO "…+00:00") — wajib sama agar perbandingan di DB benar. */
export const dbDate = (d: Date | number) => new Date(d).toISOString().replace("Z", "+00:00");

export function query<T>(sql: string, ...args: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...args) as T[];
  } finally {
    d.close();
  }
}

/** Tulis langsung ke DB e2e (mis. menyisipkan data "kotor"/nonaktif untuk uji pertahanan berlapis). */
export function tulis(fn: (db: Database.Database) => void) {
  const d = new Database("e2e.db", { fileMustExist: true });
  try {
    fn(d);
  } finally {
    d.close();
  }
}

/** Awasi error konsol/JS, pelanggaran CSP, respons ≥400 aset same-origin, dan permintaan ke origin luar. */
export async function awasi(page: Page, base = "http://localhost:3004") {
  const p = { masalah: [] as string[], luar: [] as string[], gagal: [] as string[] };
  await page.route("https://www.google.com/**", (r) => r.abort());
  page.on("console", (m) => {
    const t = m.text();
    if (/Failed to load resource/.test(t)) return;
    if (m.type() === "error" || /Refused to|Content Security Policy/i.test(t))
      p.masalah.push(`[${m.type()}] ${t}`);
  });
  page.on("pageerror", (e) => p.masalah.push(`[pageerror] ${e}`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== base && u.protocol.startsWith("http") && u.hostname !== "www.google.com")
      p.luar.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400 && r.request().resourceType() !== "document")
      p.gagal.push(`${r.status()} ${r.url()}`);
  });
  return p;
}

export const ADMIN_EMAIL = "admin@sekolah.example";
export const ADMIN_PASSWORD = "e2e-password-bukan-rahasia";
export const EDITOR_EMAIL = "editor@sekolah.example";
export const EDITOR_PASSWORD = "e2e-editor-bukan-rahasia";
/** Sama dengan NEXTAUTH_SECRET di playwright.config.mjs (hanya untuk tes). */
export const E2E_SECRET = "e2e-nextauth-secret-0123456789abcdef-xyz";

/** Login lewat UI; tiap panggilan memakai IP berbeda agar rate limit antar tes tidak saling mengganggu. */
export async function masuk(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
  callbackUrl?: string,
) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto(
    callbackUrl ? `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/admin/login",
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

/** PNG 1×1 valid (untuk uji unggah; benar-benar bisa ditampilkan browser). */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
export const berkasPng = (name = "foto.png") => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
export const berkasSvg = (name = "x.png") => ({
  name,
  mimeType: "image/png",
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
});

/** Login yang berhasil: tunggu sampai benar-benar masuk panel (bukan sekadar klik tombol). */
export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await masuk(page, email, password);
  await page.waitForURL(/\/admin$/);
}

export const PDF_MIN = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
export const berkasPdf = (name = "dok.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: PDF_MIN,
});

/** Isi formulir PPDB sampai ke langkah "Tinjau" (kecuali `sampaiLangkah` lebih kecil). */
export async function isiWizard(
  page: Page,
  o: {
    nama?: string;
    pekerjaan?: string;
    alamat?: string;
    asal?: string;
    dokumen?: boolean;
    sampaiLangkah?: 1 | 2 | 3 | 4;
  } = {},
) {
  const stop = o.sampaiLangkah ?? 4;
  await page.getByLabel("Nama lengkap calon siswa").fill(o.nama ?? "Siswa Uji");
  await page.getByLabel("Tempat lahir").fill("Yogyakarta");
  await page.getByLabel("Tanggal lahir").fill("2014-05-20");
  await page.getByLabel("Jenis kelamin").selectOption("L");
  await page.getByLabel("Jenjang tujuan").selectOption("SMP Kelas 7");
  await page.getByLabel("Asal sekolah").fill(o.asal ?? "SDN 1 Sleman");
  await page.getByLabel("Alamat lengkap").fill(o.alamat ?? "Jl. Melati No. 5, Sleman, Yogyakarta");
  if (stop === 1) return;
  await page.getByRole("button", { name: "Lanjut →" }).click();
  await page.getByLabel("Nama orang tua/wali").fill("Ahmad Santoso");
  await page.getByLabel("No. HP / WhatsApp").fill("081234567890");
  await page.getByLabel("Pekerjaan (opsional)").fill(o.pekerjaan ?? "Wiraswasta");
  if (stop === 2) return;
  await page.getByRole("button", { name: "Lanjut →" }).click();
  if (o.dokumen !== false) {
    await page.getByLabel("Akta kelahiran").setInputFiles(berkasPng("akta.png"));
    await page.getByLabel("Kartu keluarga").setInputFiles(berkasPdf("kk.pdf"));
    await page.getByLabel("Rapor / ijazah terakhir").setInputFiles(berkasPng("rapor.png"));
  }
  if (stop === 3) return;
  await page.getByRole("button", { name: "Lanjut →" }).click();
}
