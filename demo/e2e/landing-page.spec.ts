import { expect, test } from "@playwright/test";
import { base, cekDasar, gambarTermuat, pantau, tanpaOverflow } from "./helpers";

const URL = base("landing-page");

test.describe("landing-page (sample statis)", () => {
  test("muat bersih: tanpa galat console/HTTP, gambar termuat, banner & noindex ada", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(URL);
    await cekDasar(page, /Catatin Kas/);
    await gambarTermuat(page);
    await tanpaOverflow(page);
    expect(p.galat).toEqual([]);
  });

  test("navigasi anchor bekerja di sub-path", async ({ page }) => {
    await page.goto(URL);
    await page
      .getByRole("navigation", { name: /utama/i })
      .getByRole("link", { name: "FAQ" })
      .first()
      .click();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator("#faq")).toBeInViewport();
  });

  test("form kontak: validasi, lalu sukses SIMULASI tanpa request ke server", async ({ page }) => {
    const p = pantau(page);
    await page.goto(URL);
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByRole("button", { name: /Kirim/ }).click();
    await expect(form.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(form.getByText(/Nomor HP tidak valid/)).toBeVisible();

    await form.getByLabel(/^Nama/).fill("Budi Santoso");
    await form.getByLabel(/Nomor WhatsApp/).fill("081234567890");
    await form.getByLabel(/Pesan/).fill("Tanya paket toko");
    await form.getByRole("button", { name: /Kirim/ }).click();
    await expect(form.getByRole("status")).toContainText("Ini versi demo");
    const wa = form.getByRole("link", { name: /pesan WhatsApp/ });
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/62\d+\?text=/);
    expect(decodeURIComponent((await wa.getAttribute("href"))!)).toContain("Budi Santoso");
    expect(p.galat).toEqual([]);
    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
  });

  test("tombol WhatsApp dicegat di demo (nomor contoh): tidak membuka wa.me, muncul penjelasan", async ({
    page,
  }) => {
    const p = pantau(page);
    let keWa = false;
    page.on("request", (r) => {
      if (/wa\.me|whatsapp\.com/.test(r.url())) keWa = true;
    });
    await page.goto(URL);
    const tombol = page.getByRole("link", { name: /WhatsApp/ }).last();
    await expect(tombol).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    await tombol.click();
    await expect(page.getByTestId("demo-info-wa")).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
    expect(keWa).toBe(false);
    expect(p.galat).toEqual([]);
  });

  test("halaman tidak ada → 404 dengan konten (404.html)", async ({ page }) => {
    const res = await page.goto(`${URL}tidak-ada/`);
    expect(res?.status()).toBe(404);
  });
});
