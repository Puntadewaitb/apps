import { expect, test, type Page } from "@playwright/test";

const MAPS_SRC = "https://www.google.com/maps?q=Yogyakarta&output=embed";

async function bukaUndangan(page: Page) {
  // Peta tidak boleh benar-benar dimuat dari internet saat tes.
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Buka Undangan" }).click();
}

test("profil mempelai: nama lengkap, orang tua, foto ber-alt, kutipan", async ({ page }) => {
  await bukaUndangan(page);
  const sec = page.locator("#mempelai");
  await expect(sec.getByText("Raka Pratama")).toBeVisible();
  await expect(sec.getByText("Anisa Putri")).toBeVisible();
  await expect(sec.getByText("Putra dari Bapak Hendra Pratama & Ibu Sari Wulandari")).toBeVisible();
  await expect(
    sec.getByText("Putri dari Bapak Darmawan Saputra & Ibu Lestari Ningsih"),
  ).toBeVisible();
  await expect(sec.getByRole("img", { name: "Foto mempelai pria" })).toBeVisible();
  await expect(sec.getByRole("img", { name: "Foto mempelai wanita" })).toBeVisible();
  await expect(sec.locator("blockquote")).toContainText("QS. Ar-Rum: 21");
});

test("akad & resepsi: tanggal, jam, dan lokasi masing-masing", async ({ page }) => {
  await bukaUndangan(page);
  const akad = page.getByTestId("sesi-akad");
  await expect(akad).toContainText("Akad Nikah");
  await expect(akad).toContainText("Sabtu, 20 Februari 2027");
  await expect(akad).toContainText("08.00 WIB");
  await expect(akad).toContainText("Gedung Serbaguna Melati");
  const resepsi = page.getByTestId("sesi-resepsi");
  await expect(resepsi).toContainText("Resepsi");
  await expect(resepsi).toContainText("11.00 WIB");
  await expect(resepsi).toContainText("Balai Pertemuan Kenanga");
});

test("embed Maps: assert src/title iframe (tanpa memuatnya), tautan buka di Maps", async ({
  page,
}) => {
  await bukaUndangan(page);
  const frame = page.locator("#acara iframe");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", MAPS_SRC);
  await expect(frame).toHaveAttribute("title", /Peta lokasi Gedung Serbaguna Melati/);
  await expect(frame).toHaveAttribute("loading", "lazy");
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
  await expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  const links = page.getByRole("link", { name: "Buka di Google Maps" });
  await expect(links).toHaveCount(2); // akad + resepsi (lokasi berbeda)
  for (const l of await links.all()) {
    await expect(l).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
    );
    await expect(l).toHaveAttribute("target", "_blank");
    await expect(l).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("CSP mengizinkan frame hanya dari www.google.com", async ({ request }) => {
  const csp = (await request.get("/")).headers()["content-security-policy"]!;
  expect(csp).toContain("frame-src https://www.google.com;");
  expect(csp).toContain("frame-ancestors 'none'");
});

test.describe("countdown", () => {
  test("menghitung mundur ke akad & berdetak (jam dikunci)", async ({ page }) => {
    await page.clock.install({ time: new Date("2027-02-18T07:00:00+07:00") });
    await bukaUndangan(page);
    const cd = page.getByTestId("countdown");
    // 2 hari 1 jam tepat sebelum akad 08.00 WIB
    await expect(cd).toContainText("02Hari");
    await expect(cd).toContainText("01Jam");
    await expect(cd).toContainText("00Menit");
    await page.clock.fastForward(61_000);
    await expect(cd).toContainText("58Menit");
  });

  test("setelah akad dimulai tampil ucapan terima kasih", async ({ page }) => {
    await page.clock.install({ time: new Date("2027-02-20T09:00:00+07:00") });
    await bukaUndangan(page);
    await expect(page.getByTestId("countdown-selesai")).toContainText("Terima kasih");
    await expect(page.getByTestId("countdown")).toHaveCount(0);
  });

  test("berganti ke 'selesai' saat melewati waktu akad", async ({ page }) => {
    await page.clock.install({ time: new Date("2027-02-20T07:59:58+07:00") });
    await bukaUndangan(page);
    await expect(page.getByTestId("countdown")).toBeVisible();
    await page.clock.fastForward(4000);
    await expect(page.getByTestId("countdown-selesai")).toBeVisible();
  });
});

test.describe("simpan ke kalender (.ics)", () => {
  test("tautan di halaman mengarah ke /api/kalender", async ({ page }) => {
    await bukaUndangan(page);
    const a = page.getByRole("link", { name: /Simpan ke Kalender/ });
    await expect(a).toHaveAttribute("href", "/api/kalender");
    await expect(a).toHaveAttribute("download", /\.ics$/);
  });

  test("berkas .ics valid berisi akad & resepsi", async ({ request }) => {
    const res = await request.get("/api/kalender");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/calendar");
    expect(res.headers()["content-disposition"]).toBe(
      'attachment; filename="undangan-raka-anisa.ics"',
    );
    const text = await res.text();
    expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(text).toContain("SUMMARY:Akad Nikah Raka & Anisa");
    expect(text).toContain("SUMMARY:Resepsi Raka & Anisa");
    expect(text).toContain("DTSTART:20270220T010000Z"); // 08.00 WIB
    expect(text).toContain("DTEND:20270220T020000Z");
    expect(text).toContain("DTSTART:20270220T040000Z"); // 11.00 WIB
    expect(text).toContain("DTEND:20270220T070000Z");
    expect(text).toMatch(/LOCATION:Gedung Serbaguna Melati\\, Jl\. Melati/);
    expect(text).not.toMatch(/[^\r]\n/);
  });

  test("filter ?acara=: satu acara; nilai tak dikenal → 400", async ({ request }) => {
    const akad = await (await request.get("/api/kalender?acara=akad")).text();
    expect(akad.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(akad).toContain("SUMMARY:Akad Nikah");
    const resepsi = await (await request.get("/api/kalender?acara=resepsi")).text();
    expect(resepsi).toContain("SUMMARY:Resepsi");
    expect(resepsi).not.toContain("SUMMARY:Akad");
    expect((await request.get("/api/kalender?acara=<script>")).status()).toBe(400);
  });
});

test("halaman penuh tanpa overflow horizontal di 360/768/1280", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(over, `overflow di ${width}px`).toBe(false);
  }
});
