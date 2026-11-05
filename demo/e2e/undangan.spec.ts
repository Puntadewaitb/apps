import { expect, test } from "@playwright/test";
import { base, cekDasar, gambarTermuat, pantau, tanpaOverflow, tenang } from "./helpers";

const URL = base("undangan");

async function buka(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Buka Undangan" }).click();
  await expect(page.locator("#cover")).toBeHidden();
}

test.describe("undangan (sample statis)", () => {
  test.beforeEach(async ({ page }) => tenang(page));

  test("muat bersih; data acara dari seed; gambar & audio di bawah sub-path termuat", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(URL);
    await cekDasar(page, /Raka & Anisa/);
    await expect(page.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
    await buka(page);
    await expect(page.getByTestId("tanggal-akad")).toBeVisible();
    await gambarTermuat(page);
    await tanpaOverflow(page);
    const audio = await page.locator("audio").getAttribute("src");
    expect(audio).toBe(`${URL}audio/latar.wav`);
    expect((await page.request.get(audio!)).status()).toBe(200);
    expect(p.galat).toEqual([]);
  });

  test("?to= mengisi nama tamu (disanitasi) tanpa hydration error; ?kode= memakai data tamu seed", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}?to=Budi%20Santoso`);
    await expect(page.getByTestId("nama-tamu")).toHaveText("Budi Santoso");
    await page.goto(`${URL}?to=${encodeURIComponent("<img src=x onerror=alert(1)>Sinta")}`);
    await expect(page.getByTestId("nama-tamu")).toHaveText("Sinta");
    expect(await page.locator("img[src='x']").count()).toBe(0);
    await page.goto(`${URL}?kode=DEMO-0001`);
    await expect(page.getByTestId("nama-tamu")).toHaveText("Bapak Budi Santoso & Keluarga");
    await buka(page);
    await expect(page.getByRole("form", { name: "Form RSVP" }).getByLabel(/^Nama/)).toHaveValue(
      "Bapak Budi Santoso & Keluarga",
    );
    // maks. 4 orang untuk DEMO-0001
    await expect(page.getByLabel(/Jumlah orang/).locator("option")).toHaveCount(4);
    // kode tak dikenal → diperlakukan tamu umum
    await page.goto(`${URL}?kode=TIDAK-ADA`);
    await expect(page.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
    expect(p.galat).toEqual([]);
  });

  test("RSVP: validasi sama dengan versi lengkap, lalu sukses disimpan lokal tanpa request ke server", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(URL);
    await buka(page);
    const f = page.getByRole("form", { name: "Form RSVP" });
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(f.getByText(/Nama minimal 2 karakter/)).toBeVisible();
    await f.getByLabel(/^Nama/).fill("Sinta Dewi");
    await f.getByRole("radio", { name: "Hadir", exact: true }).check();
    await f.getByLabel(/Jumlah orang/).selectOption("3");
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("rsvp-sukses")).toContainText("3 orang");
    expect(p.galat).toEqual([]);
    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
    // tersimpan di peramban ini saja
    const tersimpan = await page.evaluate(() => localStorage.getItem("demo:undangan:rsvp"));
    expect(tersimpan).toContain("Sinta Dewi");
  });

  test("ucapan: seed tampil; kirim → langsung tampil & bertahan setelah muat ulang; tautan (spam) tidak tampil", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(URL);
    await buka(page);
    const daftar = page.getByTestId("daftar-ucapan");
    await expect(daftar).toContainText("Selamat menempuh hidup baru");
    const f = page.getByRole("form", { name: "Form ucapan" });
    await f.getByLabel(/^Nama/).fill("Rina");
    await f.getByLabel(/Ucapan & doa/).fill("Semoga bahagia selalu <b>ya</b>");
    await f.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(f.getByRole("status")).toContainText("telah tampil");
    await expect(daftar.locator("li").first()).toContainText("Semoga bahagia selalu");
    expect(await daftar.locator("b").count()).toBe(0); // HTML dibersihkan/di-escape
    // spam bertaut → menunggu tinjauan, tidak tampil
    await f.getByLabel(/^Nama/).fill("Bot");
    await f.getByLabel(/Ucapan & doa/).fill("Kunjungi https://spam.example sekarang");
    await f.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(f.getByRole("status")).toContainText("ditinjau");
    await expect(daftar).not.toContainText("spam.example");
    await page.reload();
    await buka(page);
    await expect(page.getByTestId("daftar-ucapan")).toContainText("Semoga bahagia selalu");
    expect(p.galat).toEqual([]);
  });

  test("tombol kalender mengunduh .ics yang valid (dibuat saat build)", async ({ page }) => {
    await page.goto(URL);
    await buka(page);
    const link = page.getByRole("link", { name: /Simpan ke Kalender/ });
    const href = await link.getAttribute("href");
    expect(href).toBe(`${URL}kalender.ics`);
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/calendar|octet-stream/);
    const ics = await res.text();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  test("tanpa admin/API di hasil; 404 untuk /admin", async ({ page }) => {
    const res = await page.goto(`${URL}admin/`);
    expect(res?.status()).toBe(404);
    const api = await page.request.get(`${URL}api/rsvp/`);
    expect(api.status()).toBe(404);
  });
});
