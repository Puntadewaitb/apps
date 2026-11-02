import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { konten } from "../content/id";
import { huruf, query, suratMasuk, tag, uniqueIp } from "./helpers";
import { TOKEN_GAGAL } from "./smtp-sink";

const post = (r: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
  r.post("/api/kontak", { data, headers: { "x-forwarded-for": uniqueIp(), ...headers } });

async function buka(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto("/kontak");
}

const tunggu = async <T>(fn: () => T[], n = 1) => {
  await expect.poll(() => fn().length, { timeout: 10_000 }).toBeGreaterThanOrEqual(n);
  return fn();
};

test.describe("halaman kontak", () => {
  test("info kontak, WhatsApp, dan embed Maps (src/title diperiksa tanpa memuatnya)", async ({
    page,
  }) => {
    await buka(page);
    await expect(page).toHaveTitle(`Kontak | ${konten.perusahaan.nama}`);
    const info = page.getByTestId("info-kontak");
    await expect(info).toContainText(konten.kontak.telepon);
    await expect(info).toContainText(konten.kontak.alamat);
    await expect(info.getByRole("link", { name: konten.kontak.email })).toHaveAttribute(
      "href",
      `mailto:${konten.kontak.email}`,
    );
    await expect(page.getByRole("link", { name: "Chat via WhatsApp" }).first()).toHaveAttribute(
      "href",
      new RegExp(`^https://wa\\.me/${konten.kontak.whatsapp}\\?text=`),
    );
    const frame = page.locator("main iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("src", konten.kontak.mapsUrl);
    await expect(frame).toHaveAttribute("title", /Peta lokasi/);
    await expect(frame).toHaveAttribute("loading", "lazy");
    await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
    const csp = (await page.request.get("/kontak")).headers()["content-security-policy"]!;
    expect(csp).toContain("frame-src https://www.google.com;");
  });

  test("kirim pesan valid: tersimpan di DB & email notifikasi diterima SMTP", async ({ page }) => {
    const nama = `Pengirim ${huruf()}`;
    const t = tag("p");
    await buka(page);
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByLabel("Nama").fill(nama);
    await form.getByLabel("Email").fill("Budi.Santoso@Contoh.ID");
    await form.getByLabel(/Nomor telepon/).fill("0812-3456-7890");
    await form.getByLabel(/Layanan yang diminati/).selectOption("analitik-data");
    await form.getByLabel(/^Pesan/).fill(`Kami butuh dasbor penjualan ${t}`);
    await form.getByRole("button", { name: "Kirim Pesan" }).click();
    await expect(page.getByTestId("kontak-sukses")).toContainText("Pesan Anda telah kami terima");
    // formulir dikosongkan setelah sukses
    await expect(form.getByLabel("Nama")).toHaveValue("");

    const rows = query<{ email: string; telepon: string; layanan: string; emailTerkirim: number }>(
      "SELECT email, telepon, layanan, emailTerkirim FROM Pesan WHERE nama = ?",
      nama,
    );
    expect(rows).toEqual([
      {
        email: "budi.santoso@contoh.id",
        telepon: "6281234567890",
        layanan: "analitik-data",
        emailTerkirim: 1,
      },
    ]);

    const surel = (await tunggu(suratMasuk)).find((s) => s.data.includes(t));
    expect(surel, "email tidak diterima sink").toBeTruthy();
    expect(surel!.from).toBe("website@cakramandiri.example");
    expect(surel!.to).toEqual(["admin@cakramandiri.example"]);
    expect(surel!.data).toMatch(/Reply-To: .*budi\.santoso@contoh\.id/i);
    expect(surel!.data).toMatch(/Subject: \[Kontak website\] Pengirim/);
    expect(surel!.data).toContain(`Kami butuh dasbor penjualan ${t}`);
    expect(surel!.data).toContain("Layanan : analitik-data");
    expect(surel!.data).not.toMatch(/Content-Type: text\/html/i); // teks polos saja
  });

  test("SMTP menolak: pesan tetap tersimpan (emailTerkirim=0) dan pengunjung tetap melihat sukses", async ({
    request,
  }) => {
    const nama = `Gagal ${huruf()}`;
    const res = await post(request, {
      nama,
      email: "gagal@contoh.id",
      isi: `Pesan uji SMTP gagal ${TOKEN_GAGAL}`,
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).ok).toBe(true);
    expect(query("SELECT emailTerkirim FROM Pesan WHERE nama = ?", nama)).toEqual([
      { emailTerkirim: 0 },
    ]);
  });

  test("validasi: pesan jelas per field, tidak tersimpan", async ({ page }) => {
    await buka(page);
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByLabel("Nama").fill("A");
    await form.getByLabel("Email").fill("bukan-email");
    await form.getByLabel(/^Pesan/).fill("pendek");
    await form.getByRole("button", { name: "Kirim Pesan" }).click();
    await expect(form.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(form.getByText(/Email tidak valid/)).toBeVisible();
    await expect(form.getByText(/Pesan minimal 10 karakter/)).toBeVisible();
    await expect(form.getByLabel("Nama")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("kontak-sukses")).toHaveCount(0);
  });
});

test.describe("API /api/kontak", () => {
  const ok = {
    nama: "Budi Santoso",
    email: "budi@contoh.id",
    isi: "Pesan uji coba yang cukup panjang.",
  };

  test("injeksi header email via nama/email ditolak oleh validasi", async ({ request }) => {
    const a = await post(request, { ...ok, nama: "Budi\r\nBcc: jahat@x.id" });
    expect(a.status()).toBe(400);
    expect((await a.json()).errors.nama).toBeTruthy();
    const b = await post(request, { ...ok, email: "a@b.id\r\nBcc: jahat@x.id" });
    expect(b.status()).toBe(400);
    expect((await b.json()).errors.email).toBeTruthy();
  });

  test("tag HTML dibuang dari isi; layanan/telepon tidak valid ditolak", async ({ request }) => {
    const t = tag("h");
    const r = await post(request, {
      ...ok,
      nama: `Html ${huruf()}`,
      isi: `Halo <script>alert(1)</script><b>tim</b> ${t} butuh bantuan.`,
    });
    expect(r.status()).toBe(201);
    const [row] = query<{ isi: string }>("SELECT isi FROM Pesan WHERE isi LIKE ?", `%${t}%`);
    expect(row!.isi).not.toMatch(/[<>]/);
    const bad = await post(request, { ...ok, layanan: "tidak-ada", telepon: "123" });
    expect(bad.status()).toBe(400);
    expect(Object.keys((await bad.json()).errors).sort()).toEqual(["layanan", "telepon"]);
  });

  test("honeypot, content-type, JSON rusak, body besar, origin asing", async ({ request }) => {
    const nama = `Bot ${huruf()}`;
    const bot = await post(request, { ...ok, nama, website_url: "http://spam.example" });
    expect(bot.status()).toBe(200);
    expect(query("SELECT 1 FROM Pesan WHERE nama = ?", nama)).toHaveLength(0);

    const ip = { "x-forwarded-for": uniqueIp() };
    expect((await request.post("/api/kontak", { headers: ip, form: { nama: "x" } })).status()).toBe(
      415,
    );
    expect(
      (
        await request.post("/api/kontak", {
          headers: { ...ip, "content-type": "application/json" },
          data: "{rusak",
        })
      ).status(),
    ).toBe(400);
    expect((await post(request, { ...ok, isi: "x".repeat(11_000) })).status()).toBe(413);
    expect((await post(request, ok, { origin: "http://evil.example" })).status()).toBe(403);
  });

  test("rate limit: ke-6 dari IP sama → 429 + Retry-After", async ({ request }) => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++)
      expect((await post(request, {}, { "x-forwarded-for": ip })).status()).toBe(400);
    const blocked = await post(request, {}, { "x-forwarded-for": ip });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  });
});
