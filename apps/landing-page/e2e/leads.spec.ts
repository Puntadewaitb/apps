import { expect, test } from "@playwright/test";
import { site } from "../content/site";
import { leadsWhere, uniqueIp, uniqueTag } from "./helpers";

test.describe("form lead (UI)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    // Jangan sentuh internet: cegat navigasi ke wa.me.
    await page.route("https://wa.me/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>WA" }),
    );
  });

  test("submit valid tersimpan lalu diarahkan ke WhatsApp dengan pesan terisi", async ({
    page,
  }) => {
    const tag = uniqueTag();
    await page.goto("/");
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByLabel("Nama").fill(`Budi Santoso`);
    await form.getByLabel("Nomor WhatsApp").fill("0812-3456-7890");
    await form.getByLabel("Pesan (opsional)").fill(`Mau demo ${tag}`);

    await Promise.all([
      page.waitForURL(/^https:\/\/wa\.me\/6281234567890\?text=/),
      form.getByRole("button", { name: /Kirim/ }).click(),
    ]);
    const url = new URL(page.url());
    const text = url.searchParams.get("text") ?? "";
    expect(text).toContain(site.brand);
    expect(text).toContain("Budi Santoso");
    expect(text).toContain(`Mau demo ${tag}`);

    const rows = leadsWhere("message", tag);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Budi Santoso", phone: "6281234567890" });
  });

  test("submit invalid ditolak dengan pesan jelas & tidak tersimpan", async ({ page }) => {
    const tag = uniqueTag();
    await page.goto("/");
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByLabel("Nama").fill("A");
    await form.getByLabel("Nomor WhatsApp").fill("123");
    await form.getByLabel("Pesan (opsional)").fill(`invalid ${tag}`);
    await form.getByRole("button", { name: /Kirim/ }).click();

    await expect(form.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(form.getByText(/Nomor HP tidak valid/)).toBeVisible();
    await expect(form.getByLabel("Nama")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/localhost:3001\/?$/); // tidak berpindah
    expect(leadsWhere("message", tag)).toHaveLength(0);
  });

  test("field kosong ditolak dari server (noValidate), bukan tooltip browser", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByRole("button", { name: /Kirim/ }).click();
    await expect(form.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(form.getByText(/Nomor HP tidak valid/)).toBeVisible();
  });
});

test.describe("API /api/leads", () => {
  const post = (
    request: import("@playwright/test").APIRequestContext,
    data: unknown,
    headers: Record<string, string> = {},
  ) =>
    request.post("/api/leads", {
      data,
      headers: { "x-forwarded-for": uniqueIp(), ...headers },
    });

  test("201 + whatsappUrl untuk input valid; teks disanitasi", async ({ request }) => {
    const tag = uniqueTag();
    const res = await post(request, {
      name: "Siti Aminah",
      phone: "+6281298765432",
      message: `<script>alert(1)</script>Halo ${tag}`,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.whatsappUrl).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
    const [row] = leadsWhere("message", tag);
    expect(row?.message).not.toContain("<");
    expect(row?.phone).toBe("6281298765432");
  });

  test("400 dengan pesan per field untuk input invalid", async ({ request }) => {
    const res = await post(request, { name: "", phone: "abc", message: "x".repeat(1500) });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors).sort()).toEqual(["message", "name", "phone"]);
  });

  test("honeypot terisi: pura-pura sukses tapi tidak disimpan", async ({ request }) => {
    const tag = uniqueTag("bot");
    const res = await post(request, {
      name: `Bot ${tag}`,
      phone: "081234567890",
      message: "spam",
      website_url: "http://spam.example",
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(leadsWhere("name", tag)).toHaveLength(0);
  });

  test("rate limit: permintaan ke-6 dari IP sama → 429 + Retry-After", async ({ request }) => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) {
      const r = await post(request, {}, { "x-forwarded-for": ip });
      expect(r.status()).toBe(400);
    }
    const blocked = await post(request, {}, { "x-forwarded-for": ip });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
    // IP lain tidak terpengaruh
    expect((await post(request, {})).status()).toBe(400);
  });

  test("menolak content-type non-JSON, JSON rusak, body besar, dan origin asing", async ({
    request,
  }) => {
    const ip = { "x-forwarded-for": uniqueIp() };
    const r1 = await request.post("/api/leads", { headers: ip, form: { name: "x" } });
    expect(r1.status()).toBe(415);

    const r2 = await request.post("/api/leads", {
      headers: { ...ip, "content-type": "application/json" },
      data: "{bukan json",
    });
    expect(r2.status()).toBe(400);

    const r3 = await request.post("/api/leads", {
      headers: { ...ip, "content-type": "application/json" },
      data: JSON.stringify({ name: "a", phone: "b", message: "x".repeat(20_000) }),
    });
    expect(r3.status()).toBe(413);

    const r4 = await request.post("/api/leads", {
      headers: { ...ip, origin: "http://evil.example" },
      data: { name: "Budi", phone: "081234567890", message: "" },
    });
    expect(r4.status()).toBe(403);
  });
});
