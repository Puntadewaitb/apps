import { expect, test, type Page } from "@playwright/test";
import { loginAdmin } from "./helpers";

async function pratinjau(page: Page, slug: string) {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await loginAdmin(page);
  await page.goto(`/admin/pratinjau/${slug}`);
}
const wrapper = (page: Page) => page.locator("[data-jenis]");
const token = (page: Page, nama: string) =>
  wrapper(page).evaluate(
    (el, n) => getComputedStyle(el).getPropertyValue(n).trim().toLowerCase(),
    nama,
  );

test("daftar pratinjau: 3 acara demo dengan jenis & tema", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/pratinjau");
  const kartu = page.getByTestId("kartu-acara");
  await expect(kartu).toHaveCount(3);
  await expect(kartu.filter({ hasText: "Pernikahan Raka & Anisa" })).toContainText("Tema: floral");
  await expect(kartu.filter({ hasText: "Pernikahan Raka & Anisa" })).toContainText("aktif");
  await expect(kartu.filter({ hasText: "Aqiqah Zahra" })).toContainText("Tema: islami");
  await expect(kartu.filter({ hasText: "Khitanan Fatih" })).toContainText("Tema: elegan");
});

test("publik (pernikahan): tema floral, dua mempelai, akad + resepsi, kisah cinta", async ({
  page,
}) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "floral");
  await expect(wrapper(page)).toHaveAttribute("data-theme", "floral");
  await expect(wrapper(page)).toHaveAttribute("data-jenis", "pernikahan");
  expect(await token(page, "--primary")).toBe("#be185d");
  await page.getByRole("button", { name: "Buka Undangan" }).click();
  await expect(page.locator("#mempelai figure")).toHaveCount(2);
  await expect(page.getByTestId("sesi-akad")).toBeVisible();
  await expect(page.getByTestId("sesi-resepsi")).toBeVisible();
  await expect(page.locator("#cerita")).toHaveCount(1);
});

test("aqiqah (tema islami): satu sesi, satu profil, tanpa kisah cinta, pratinjau baca-saja", async ({
  page,
}) => {
  await pratinjau(page, "aqiqah-demo");
  await expect(page.getByTestId("banner-pratinjau")).toContainText("Mode pratinjau");
  await expect(wrapper(page)).toHaveAttribute("data-theme", "islami");
  await expect(wrapper(page)).toHaveAttribute("data-jenis", "aqiqah");
  expect(await token(page, "--primary")).toBe("#166534");

  await expect(page.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
  await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toContainText(
    "Undangan Aqiqah",
  );
  await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toContainText("Zahra");
  await page.getByRole("button", { name: "Buka Undangan" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Zahra");
  await expect(page.locator("#mempelai h2")).toHaveText("Si Kecil");
  await expect(page.locator("#mempelai figure")).toHaveCount(1);
  await expect(page.locator("#mempelai")).toContainText("Zahra Kamila Putri");
  await expect(page.locator("#mempelai")).toContainText("Putri dari Bapak Rizal Firmansyah");
  await expect(page.getByTestId("sesi-akad")).toContainText("Acara Aqiqah");
  await expect(page.getByTestId("sesi-akad")).toContainText("Sabtu, 6 Maret 2027");
  await expect(page.getByTestId("sesi-akad")).toContainText("09.00 WIB");
  await expect(page.getByTestId("sesi-resepsi")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Akad Nikah");
  await expect(page.locator("body")).not.toContainText("Resepsi");
  await expect(page.locator("#cerita")).toHaveCount(0);
  // pratinjau baca-saja
  await expect(page.getByTestId("catatan-pratinjau")).toBeVisible();
  await expect(page.getByRole("form", { name: "Form RSVP" })).toHaveCount(0);
  await expect(page.getByRole("form", { name: "Form ucapan" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Simpan ke Kalender/ })).toHaveCount(0);
});

test("khitan (tema elegan): judul & label sesuai jenis", async ({ page }) => {
  await pratinjau(page, "khitan-demo");
  await expect(wrapper(page)).toHaveAttribute("data-theme", "elegan");
  expect(await token(page, "--primary")).toBe("#1f2a44");
  await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toContainText(
    "Undangan Khitanan",
  );
  await page.getByRole("button", { name: "Buka Undangan" }).click();
  await expect(page.locator("#mempelai h2")).toHaveText("Yang Dikhitan");
  await expect(page.getByTestId("sesi-akad")).toContainText("Acara Khitanan");
  await expect(page.getByTestId("sesi-akad")).toContainText("Sabtu, 13 Maret 2027");
  await expect(page.getByTestId("sesi-akad")).toContainText("Aula Masjid Al-Hikmah");
  await expect(page.locator("#cerita")).toHaveCount(0);
  await expect(page.locator("#mempelai blockquote")).toHaveCount(0); // tanpa kutipan
});

test("warna benar-benar berbeda antar tema (bukan hanya atribut)", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await loginAdmin(page);
  const warna: Record<string, string> = {};
  for (const [slug, tema] of [
    ["raka-anisa", "floral"],
    ["aqiqah-demo", "islami"],
    ["khitan-demo", "elegan"],
  ] as const) {
    await page.goto(`/admin/pratinjau/${slug}`);
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const bg = await page
      .locator("#mempelai")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    warna[tema] = bg;
  }
  expect(new Set(Object.values(warna)).size).toBe(3);
});

test("pratinjau slug tak dikenal → 404; ICS acara aktif tetap pernikahan", async ({
  page,
  request,
}) => {
  await loginAdmin(page);
  const res = await page.goto("/admin/pratinjau/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Undangan tidak ditemukan");
  const ics = await (await request.get("/api/kalender")).text();
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  expect(ics).toContain("SUMMARY:Akad Nikah Raka & Anisa");
});
