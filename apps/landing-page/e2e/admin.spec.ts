import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, uniqueIp, uniqueTag } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

async function login(page: import("@playwright/test").Page, password = ADMIN_PASSWORD) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test("tanpa login: halaman leads redirect ke login, ekspor 401", async ({ page, request }) => {
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
  const res = await request.get("/admin/leads/export");
  expect(res.status()).toBe(401);
});

test("password salah ditolak dengan pesan jelas", async ({ page }) => {
  await login(page, "salah-total");
  await expect(page).toHaveURL(/\/admin\/login\?error=salah/);
  await expect(page.locator("main [role=alert]")).toHaveText("Password salah.");
});

test("login, lihat lead, ekspor CSV (formula dinetralkan), logout", async ({ page, request }) => {
  const tag = uniqueTag();
  const made = await request.post("/api/leads", {
    headers: { "x-forwarded-for": uniqueIp() },
    data: { name: "Dewi Lestari", phone: "081211112222", message: `=1+1 ${tag}` },
  });
  expect(made.status()).toBe(201);

  await login(page);
  await expect(page).toHaveURL(/\/admin\/leads$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Leads");
  const row = page.getByRole("row", { name: new RegExp(tag) });
  await expect(row).toContainText("Dewi Lestari");
  await expect(row).toContainText("6281211112222");

  // cookie sesi: HttpOnly + SameSite=Strict
  const cookie = (await page.context().cookies()).find((c) => c.name === "admin_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");

  const csv = await page.request.get("/admin/leads/export");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toMatch(
    /attachment; filename="leads-\d{4}-\d{2}-\d{2}\.csv"/,
  );
  const text = await csv.text();
  expect(text.split("\r\n")[0]).toContain("id,waktu,nama,no_hp,pesan");
  expect(text).toContain(`'=1+1 ${tag}`); // diawali apostrof → bukan formula
  expect(text).not.toMatch(new RegExp(`(^|,)=1\\+1 ${tag}`, "m"));

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get("/admin/leads/export")).status()).toBe(401);
});

test("cookie sesi palsu/rusak tidak diterima", async ({ page, context }) => {
  await context.addCookies([
    { name: "admin_session", value: "9999999999.abc.palsu", url: "http://localhost:3001" },
  ]);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("login dibatasi: percobaan ke-6 → terlalu banyak", async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await login(page, `salah-${i}`);
    await expect(page).toHaveURL(/error=salah/);
  }
  await login(page, ADMIN_PASSWORD); // password benar pun ditolak saat dibatasi
  await expect(page).toHaveURL(/error=terlalu-banyak/);
});

test("login dengan origin asing ditolak (CSRF)", async ({ request }) => {
  const res = await request.post("/api/admin/login", {
    headers: { origin: "http://evil.example", "x-forwarded-for": uniqueIp() },
    form: { password: ADMIN_PASSWORD },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(403);
});
