import { expect, test } from "@playwright/test";
import { agendas } from "../prisma/seed-data";
import { awasi, dbDate, query, tulis } from "./helpers";

const wib = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Jakarta",
});
const hari = (d: Date | string) => wib.format(new Date(d));
const bulanKunci = (d: Date | string) => hari(d).slice(0, 7);
const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type Baris = { id: number; title: string; startsAt: string; endsAt: string | null };
/** Agenda seed dari DB (startsAt disimpan sebagai epoch ms oleh Prisma-SQLite atau ISO; normalkan). */
function ambil(): Array<{ id: number; title: string; mulai: Date; akhir: Date | null }> {
  return query<Baris>(
    "SELECT id, title, startsAt, endsAt FROM Agenda WHERE title NOT LIKE 'Uji %' ORDER BY id",
  ).map((r) => ({
    id: r.id,
    title: r.title,
    mulai: new Date(typeof r.startsAt === "number" ? r.startsAt : r.startsAt),
    akhir: r.endsAt === null ? null : new Date(typeof r.endsAt === "number" ? r.endsAt : r.endsAt),
  }));
}

test.describe("agenda", () => {
  test("data seed ada di DB sebanyak data demo & semuanya di masa depan", () => {
    const a = ambil();
    expect(a).toHaveLength(agendas.length);
    for (const x of a) expect(x.mulai.getTime(), x.title).toBeGreaterThan(Date.now());
  });

  test("bulan default = bulan ini (WIB): judul kalender, tombol navigasi, hari ini bertanda", async ({
    page,
  }) => {
    await page.goto("/agenda");
    const kunci = hari(new Date()).slice(0, 7);
    const [t, b] = kunci.split("-").map(Number);
    await expect(page.getByTestId("kalender")).toHaveAttribute("data-bulan", kunci);
    await expect(page.getByTestId("judul-bulan")).toHaveText(`${NAMA_BULAN[b! - 1]} ${t}`);
    await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
    await expect(
      page.locator(`td[data-tanggal="${hari(new Date())}"] [aria-current="date"]`),
    ).toBeVisible();
    const next = b === 12 ? `${t! + 1}-01` : `${t}-${String(b! + 1).padStart(2, "0")}`;
    await expect(page.getByRole("link", { name: /Bulan berikutnya/ })).toHaveAttribute(
      "href",
      `/agenda?bulan=${next}`,
    );
  });

  test("setiap kegiatan tampil di kalender & daftar pada bulan miliknya, di tanggal yang benar (WIB)", async ({
    page,
  }) => {
    await awasi(page);
    for (const a of ambil()) {
      const kunci = bulanKunci(a.mulai);
      await page.goto(`/agenda?bulan=${kunci}`);
      await expect(page.getByTestId("kalender")).toHaveAttribute("data-bulan", kunci);
      const item = page.getByTestId("item-agenda").filter({ hasText: a.title });
      await expect(item, a.title).toHaveCount(1);
      // sel kalender pada tanggal mulai memuat tautan ke kegiatan ini (di layar lebar)
      await page.setViewportSize({ width: 1280, height: 900 });
      const sel = page.locator(`td[data-tanggal="${hari(a.mulai)}"]`);
      await expect(sel.getByRole("link", { name: a.title }), a.title).toBeVisible();
      await expect(sel).not.toHaveAttribute("data-jumlah", "0");
    }
  });

  test("kegiatan multi-hari muncul di setiap hari yang dilewati dalam bulan itu", async ({
    page,
  }) => {
    const libur = ambil().find((a) => a.title === "Libur Semester Ganjil")!;
    const hariLibur: string[] = [];
    for (
      let d = new Date(`${hari(libur.mulai)}T00:00:00Z`);
      d <= new Date(`${hari(libur.akhir!)}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1)
    )
      hariLibur.push(d.toISOString().slice(0, 10));
    expect(hariLibur.length).toBeGreaterThan(10);
    const kunci = bulanKunci(libur.mulai);
    await page.goto(`/agenda?bulan=${kunci}`);
    for (const h of hariLibur.filter((x) => x.startsWith(kunci))) {
      await expect(page.locator(`td[data-tanggal="${h}"]`), h).not.toHaveAttribute(
        "data-jumlah",
        "0",
      );
    }
  });

  test("bulan tanpa kegiatan menampilkan pesan kosong; sel di luar bulan tidak memuat kegiatan bulan lain", async ({
    page,
  }) => {
    await page.goto("/agenda?bulan=2031-04");
    await expect(page.getByTestId("agenda-kosong")).toHaveText(
      "Tidak ada kegiatan pada bulan ini.",
    );
    await expect(page.getByTestId("judul-bulan")).toHaveText("April 2031");
  });

  test("parameter bulan aneh/berbahaya diabaikan (kembali ke bulan ini), tanpa XSS & tanpa error", async ({
    page,
  }) => {
    const p = await awasi(page);
    const kini = hari(new Date()).slice(0, 7);
    for (const v of [
      "2027-13",
      "abc",
      "2027-02-01",
      "1999-01",
      encodeURIComponent("<script>window.__x=1</script>"),
      "%00",
      "2027-2",
    ]) {
      const res = await page.goto(`/agenda?bulan=${v}`);
      expect(res?.status(), v).toBe(200);
      await expect(page.getByTestId("kalender"), v).toHaveAttribute("data-bulan", kini);
    }
    expect(p.masalah).toEqual([]);
  });

  test("navigasi bulan berfungsi tanpa JavaScript dan melintasi batas tahun", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      await page.goto("/agenda?bulan=2026-12");
      await page.getByRole("link", { name: /Bulan berikutnya/ }).click();
      await expect(page.getByTestId("judul-bulan")).toHaveText("Januari 2027");
      await page.getByRole("link", { name: /Bulan sebelumnya/ }).click();
      await page.getByRole("link", { name: /Bulan sebelumnya/ }).click();
      await expect(page.getByTestId("judul-bulan")).toHaveText("November 2026");
    } finally {
      await ctx.close();
    }
  });

  test("data kotor di DB (judul/lokasi berisi HTML) tampil sebagai teks; kegiatan di batas bulan (23.30 WIB) pada hari yang benar", async ({
    page,
  }) => {
    const kotor = `<img src=x onerror="window.__xss=1">`;
    // 31 Mei 2031 23:30 WIB = 16:30 UTC (tanggal sama di WIB, hari yang sama di UTC); 1 Juni 2031 00:30 WIB = 31 Mei 17:30 UTC
    tulis((d) => {
      const ins = d.prepare(
        "INSERT INTO Agenda (title, description, location, startsAt, endsAt, createdAt) VALUES (?, ?, ?, ?, NULL, ?)",
      );
      ins.run(
        `Uji Malam ${kotor}`,
        kotor,
        kotor,
        dbDate(new Date("2031-05-31T23:30:00+07:00")),
        dbDate(Date.now()),
      );
      ins.run(
        "Uji Lewat Tengah Malam",
        "",
        "",
        dbDate(new Date("2031-06-01T00:30:00+07:00")),
        dbDate(Date.now()),
      );
    });
    await awasi(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/agenda?bulan=2031-05");
    await expect(page.locator('td[data-tanggal="2031-05-31"]')).not.toHaveAttribute(
      "data-jumlah",
      "0",
    );
    await expect(page.getByTestId("item-agenda").filter({ hasText: "Uji Malam" })).toContainText(
      "<img",
    );
    expect(await page.getByTestId("daftar-agenda").locator("img").count()).toBe(0);
    await expect(
      page.getByTestId("item-agenda").filter({ hasText: "Uji Lewat Tengah Malam" }),
    ).toHaveCount(0);
    await page.goto("/agenda?bulan=2031-06");
    await expect(page.locator('td[data-tanggal="2031-06-01"]')).not.toHaveAttribute(
      "data-jumlah",
      "0",
    );
    await expect(
      page.getByTestId("item-agenda").filter({ hasText: "Uji Lewat Tengah Malam" }),
    ).toContainText("00.30");
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);
  });

  test("ponsel (360px): kalender tidak overflow; indikator kegiatan tersedia", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const a = ambil()[3]!;
    await page.goto(`/agenda?bulan=${bulanKunci(a.mulai)}`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);
    await expect(
      page.locator(`td[data-tanggal="${hari(a.mulai)}"]`).getByText(/\d+ kegiatan/),
    ).toBeAttached();
  });
});
