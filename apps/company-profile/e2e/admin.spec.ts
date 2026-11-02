import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, huruf, loginAdmin, tag, uniqueIp } from "./helpers";

test("tanpa login: /admin & /admin/pesan → login; ekspor 401", async ({ page, request }) => {
  for (const h of ["/admin", "/admin/pesan"]) {
    await page.goto(h);
    await expect(page, h).toHaveURL(/\/admin\/login$/);
  }
  expect((await request.get("/admin/pesan/ekspor")).status()).toBe(401);
});

test("password salah ditolak; cookie khusus app & atribut aman setelah login", async ({ page }) => {
  await loginAdmin(page, "salah-total");
  await expect(page).toHaveURL(/error=salah/);
  await expect(page.locator("main [role=alert]")).toHaveText("Password salah.");

  await loginAdmin(page);
  await expect(page).toHaveURL(/\/admin\/pesan$/);
  const cookies = await page.context().cookies();
  const c = cookies.find((x) => x.name === "company_admin");
  expect(c?.httpOnly).toBe(true);
  expect(c?.sameSite).toBe("Strict");
  expect(
    cookies.find((x) => x.name === "admin_session" || x.name === "undangan_admin"),
  ).toBeUndefined();
});

test("pesan masuk tampil di admin, ekspor CSV menetralkan formula, logout", async ({
  page,
  request,
}) => {
  const nama = `Admin ${huruf()}`;
  const t = tag("a");
  const res = await request.post("/api/kontak", {
    headers: { "x-forwarded-for": uniqueIp() },
    data: { nama, email: "uji@contoh.id", layanan: "pelatihan-sdm", isi: `=1+1 cek formula ${t}` },
  });
  expect(res.status()).toBe(201);

  await loginAdmin(page);
  await page.goto("/admin/pesan");
  const baris = page.getByTestId("baris-pesan").filter({ hasText: t });
  await expect(baris).toContainText(nama);
  await expect(baris).toContainText("uji@contoh.id");
  await expect(baris).toContainText("Pelatihan & Pengembangan SDM");
  await expect(baris).toContainText("Terkirim");

  const csv = await page.request.get("/admin/pesan/ekspor");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const teks = await csv.text();
  expect(teks.split("\r\n")[0]).toContain(
    "id,waktu,nama,email,telepon,layanan,pesan,email_terkirim",
  );
  expect(teks).toContain(`'=1+1 cek formula ${t}`);

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get("/admin/pesan/ekspor")).status()).toBe(401);
});

test("cookie palsu ditolak; login dibatasi; origin asing ditolak", async ({
  page,
  context,
  request,
}) => {
  await context.addCookies([
    { name: "company_admin", value: "9999999999.abc.palsu", url: "http://localhost:3002" },
  ]);
  await page.goto("/admin/pesan");
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  for (let i = 0; i < 5; i++) {
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(`salah-${i}`);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/error=salah/);
  }
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/error=terlalu-banyak/);

  const res = await request.post("/api/admin/login", {
    headers: { origin: "http://evil.example", "x-forwarded-for": uniqueIp() },
    form: { password: ADMIN_PASSWORD },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(403);
});
