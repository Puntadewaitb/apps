import { expect, test, type Page } from "@playwright/test";

const buka = (page: Page) => page.getByRole("button", { name: "Buka Undangan" });

test("cover tampil dulu: nama tamu default, konten di belakangnya terkunci", async ({ page }) => {
  await page.goto("/");
  const cover = page.getByRole("dialog", { name: "Sampul undangan" });
  await expect(cover).toBeVisible();
  await expect(page.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
  await expect(cover).toContainText("Raka");
  await expect(cover).toContainText("Sabtu, 20 Februari 2027");
  // konten inert + scroll terkunci selama cover tampil
  await expect(page.locator("#isi")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
});

test("?to= menampilkan nama tamu (termasuk karakter ter-encode)", async ({ page }) => {
  await page.goto("/?to=Bapak%20Budi%20%26%20Keluarga");
  await expect(page.getByTestId("nama-tamu")).toHaveText("Bapak Budi & Keluarga");
  await page.goto("/?to=Siti+Nur%E2%80%99aini");
  await expect(page.getByTestId("nama-tamu")).toHaveText("Siti Nur’aini");
});

test("?to= berbahaya tidak dieksekusi dan dirender sebagai teks aman", async ({ page }) => {
  let dialogMuncul = false;
  page.on("dialog", async (d) => {
    dialogMuncul = true;
    await d.dismiss();
  });
  const payload = encodeURIComponent("<img src=x onerror=alert(1)><script>alert(2)</script>Ani");
  await page.goto(`/?to=${payload}`);
  const nama = page.getByTestId("nama-tamu");
  await expect(nama).toContainText("Ani");
  expect(await nama.innerHTML()).not.toMatch(/<(img|script)/i);
  expect(await page.locator("#cover img, #cover script").count()).toBe(0);
  await page.waitForTimeout(300);
  expect(dialogMuncul).toBe(false);
});

test("?to= sangat panjang dipotong 60 karakter", async ({ page }) => {
  await page.goto(`/?to=${"A".repeat(500)}`);
  await expect(page.getByTestId("nama-tamu")).toHaveText("A".repeat(60));
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(over).toBe(false);
});

test("?to= kosong atau berulang", async ({ page }) => {
  await page.goto("/?to=");
  await expect(page.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
  await page.goto("/?to=Ani&to=Budi");
  await expect(page.getByTestId("nama-tamu")).toHaveText("Ani");
});

test("Buka Undangan: cover hilang, konten bisa di-scroll & fokus, musik mulai", async ({
  page,
}) => {
  await page.goto("/");
  await buka(page).click();
  await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toBeHidden();
  await expect(page.locator("#isi")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#isi")).toBeFocused();

  const toggle = page.getByRole("button", { name: "Matikan musik" });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => !a.paused)).toBe(true);
});

test("toggle musik: matikan lalu nyalakan lagi", async ({ page }) => {
  await page.goto("/");
  await buka(page).click();
  await page.getByRole("button", { name: "Matikan musik" }).click();
  const nyalakan = page.getByRole("button", { name: "Nyalakan musik" });
  await expect(nyalakan).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  await nyalakan.click();
  await expect(page.getByRole("button", { name: "Matikan musik" })).toBeVisible();
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(false);
});

test("file audio lokal tersedia & valid (tanpa jaringan luar)", async ({ request, page }) => {
  const src = await (async () => {
    await page.goto("/");
    return page.locator("audio").getAttribute("src");
  })();
  expect(src).toBe("/audio/latar.wav");
  const res = await request.get(src!);
  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.subarray(0, 4).toString()).toBe("RIFF");
  expect(body.subarray(8, 12).toString()).toBe("WAVE");
});

test("cover tanpa overflow di 360/768/1280 dan tombol terlihat", async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/?to=Bapak%20Budi%20Santoso%20dan%20Keluarga%20Besar%20Bani%20Abdurrahman");
    await expect(buka(page)).toBeInViewport();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(over, `overflow di ${width}px`).toBe(false);
  }
});
