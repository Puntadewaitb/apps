import { expect, test, type Page } from "@playwright/test";
import { konten as id } from "../../apps/company-profile/content/id";
import { konten as enKonten } from "../../apps/company-profile/content/en";
import { base, cekDasar, gambarTermuat, pantau, tanpaOverflow } from "./helpers";

const URL = base("company-profile");

async function tenang(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort()); // embed Maps: tidak perlu internet
}

test.describe("company-profile (sample statis)", () => {
  test("'/' mengalihkan ke /id/; beranda ID & EN termuat bersih, bahasa & judul benar", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    await page.goto(URL);
    await page.waitForURL(`**${URL}id/`);
    await cekDasar(page, new RegExp(id.perusahaan.nama));
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(id.hero.judul);
    await gambarTermuat(page);
    await tanpaOverflow(page);

    await page.goto(`${URL}en/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(enKonten.hero.judul);
    expect(p.galat).toEqual([]);
  });

  test("pengalih bahasa memetakan halaman yang sama (ID ↔ EN) dan nav utama bekerja", async ({
    page,
  }) => {
    await tenang(page);
    await page.goto(`${URL}id/layanan/`);
    await page
      .getByRole("link", { name: /^EN|English/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`${URL}en/layanan/?$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page
      .getByRole("link", { name: /^ID|Indonesia/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`${URL}id/layanan/?$`));
  });

  test("seluruh halaman statis dapat dibuka (200, ada <h1>) di kedua bahasa", async ({
    request,
  }) => {
    const hasil: string[] = [];
    const antre = [`${URL}id/`, `${URL}en/`];
    const lihat = new Set<string>();
    while (antre.length) {
      const u = antre.shift()!;
      if (lihat.has(u)) continue;
      lihat.add(u);
      const res = await request.get(u);
      if (res.status() !== 200) hasil.push(`${res.status()} ${u}`);
      const html = await res.text();
      if (!/<h1[\s>]/.test(html)) hasil.push(`tanpa <h1>: ${u}`);
      for (const m of html.matchAll(
        /<a [^>]*href="(\/apps\/company-profile\/(?:id|en)\/[^"#?]*)"/g,
      ))
        if (!lihat.has(m[1]!)) antre.push(m[1]!);
    }
    expect(hasil).toEqual([]);
    expect(lihat.size).toBeGreaterThan(40);
  });

  test("portofolio: filter kategori berupa halaman statis dengan aria-current & jumlah benar", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    await page.goto(`${URL}id/portofolio/`);
    const total = id.portofolio.kategori.length;
    expect(total).toBeGreaterThan(1);
    const nav = page.getByRole("navigation", { name: id.portofolio.filter.label });
    await expect(nav.getByRole("link", { name: id.portofolio.filter.semua })).toHaveAttribute(
      "aria-current",
      "true",
    );
    const semua = await page.getByTestId("jumlah-proyek").innerText();
    const k = id.portofolio.kategori[0]!;
    await nav.getByRole("link", { name: k.nama, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/portofolio/kategori/${k.id}/?$`));
    await expect(nav.getByRole("link", { name: k.nama, exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(await page.getByTestId("jumlah-proyek").innerText()).not.toBe(semua);
    expect(p.galat).toEqual([]);
  });

  test("blog: artikel & tautan internal markdown mengarah ke halaman yang ada (tanpa 404)", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    await page.goto(`${URL}id/blog/cara-memilih-vendor-pengembangan-sistem/`);
    const tautan = page.locator("article a[href*='/layanan/']").first();
    await expect(tautan).toHaveAttribute("href", `${URL}id/layanan/pengembangan-sistem`);
    await tautan.click();
    await expect(page).toHaveURL(new RegExp(`${URL}id/layanan/pengembangan-sistem/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(p.galat).toEqual([]);
  });

  test("kontak: embed peta, validasi ID/EN sama dengan versi lengkap, sukses SIMULASI tanpa request ke server", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    await page.goto(`${URL}id/kontak/`);
    await expect(page.locator("main iframe")).toHaveAttribute("src", /google\.com\/maps/);
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByRole("button", { name: "Kirim Pesan" }).click();
    await expect(form.getByText(/minimal 2 karakter/i).first()).toBeVisible();

    await form.getByLabel("Nama").fill("Budi Santoso");
    await form.getByLabel("Email").fill("budi@contoh.id");
    await form.getByLabel(/^Pesan/).fill("Kami butuh dasbor penjualan untuk 3 cabang.");
    await form.getByRole("button", { name: "Kirim Pesan" }).click();
    await expect(page.getByTestId("kontak-sukses")).toContainText("Pesan Anda telah kami terima");
    expect(await page.evaluate(() => localStorage.getItem("demo:company-profile:pesan"))).toContain(
      "Budi Santoso",
    );
    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
    // versi EN memakai pesan galat bahasa Inggris (bukan Indonesia)
    await page.goto(`${URL}en/kontak/`);
    const f2 = page.getByRole("form", { name: "Contact form" });
    await f2.getByRole("button", { name: "Send Message" }).click();
    await expect(f2.getByText(/at least 2 characters/i).first()).toBeVisible();
    await expect(f2.getByText(/minimal 2 karakter/i)).toHaveCount(0);
    expect(p.galat.filter((g) => !/google\.com|ERR_FAILED/.test(g))).toEqual([]);
  });

  test("tidak ada admin/API di hasil", async ({ request }) => {
    expect((await request.get(`${URL}admin/`)).status()).toBe(404);
    expect((await request.get(`${URL}api/kontak/`)).status()).toBe(404);
  });
});
