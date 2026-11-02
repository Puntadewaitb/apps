import { expect, test, type Page } from "@playwright/test";

async function buka(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Buka Undangan" }).click();
}

const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test.describe("dengan Clipboard API", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("rekening & e-wallet tampil; salin nomor → clipboard berisi nomor persis", async ({
    page,
  }) => {
    await buka(page);
    const bank = page.getByTestId("rekening-bank");
    await expect(bank).toContainText("Bank Nusantara (contoh)");
    await expect(bank.getByTestId("nomor")).toHaveText("1234567890");
    await expect(bank).toContainText("a.n. Raka Pratama");

    await bank.getByRole("button", { name: "Salin nomor Bank Nusantara (contoh)" }).click();
    await expect(bank.getByRole("button")).toHaveText("Tersalin ✓");
    expect(await clip(page)).toBe("1234567890");

    const ew = page.getByTestId("rekening-ewallet");
    await ew.getByRole("button", { name: /Salin nomor DompetKu/ }).click();
    expect(await clip(page)).toBe("081234567890");
  });

  test("umpan balik 'Tersalin' kembali ke 'Salin' setelah 2 detik (jam dikunci)", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2027-02-10T10:00:00+07:00") });
    await buka(page);
    const btn = page.getByTestId("rekening-bank").getByRole("button");
    await btn.click();
    await expect(btn).toHaveText("Tersalin ✓");
    await page.clock.fastForward(2100);
    await expect(btn).toHaveText("Salin");
  });

  test("salin alamat hadiah: penerima, alamat, dan telepon", async ({ page }) => {
    await buka(page);
    const kartu = page.getByTestId("hadiah");
    await expect(kartu.getByTestId("alamat-hadiah")).toContainText("Jl. Melati Raya No. 12");
    await kartu.getByRole("button", { name: "Salin alamat pengiriman hadiah" }).click();
    const teks = await clip(page);
    expect(teks).toContain("Raka & Anisa");
    expect(teks).toContain("Jl. Melati Raya No. 12, Yogyakarta 55281");
    expect(teks).toContain("Telp. 081234567890");
  });
});

test.describe("tanpa Clipboard API", () => {
  test("fallback execCommand: teks yang dipilih = nomor rekening", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
      (document as unknown as { execCommand: (c: string) => boolean }).execCommand = (
        cmd: string,
      ) => {
        const ta = [...document.querySelectorAll("textarea")].find(
          (t) => t.style.left === "-9999px",
        );
        (window as unknown as { __disalin?: string }).__disalin =
          cmd === "copy" ? ta?.value : undefined;
        return true;
      };
    });
    await buka(page);
    const btn = page.getByTestId("rekening-bank").getByRole("button");
    await btn.click();
    await expect(btn).toHaveText("Tersalin ✓");
    expect(await page.evaluate(() => (window as unknown as { __disalin?: string }).__disalin)).toBe(
      "1234567890",
    );
    // elemen bantu dibersihkan dari DOM
    expect(await page.locator("textarea[readonly]").count()).toBe(0);
  });

  test("semua cara gagal: pesan jelas muncul lalu hilang", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
      (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
    });
    await page.clock.install({ time: new Date("2027-02-10T10:00:00+07:00") });
    await buka(page);
    const kartu = page.getByTestId("rekening-bank");
    await kartu.getByRole("button").click();
    await expect(kartu.getByRole("status")).toHaveText(
      "Gagal menyalin. Silakan salin secara manual.",
    );
    await expect(kartu.getByRole("button")).toHaveText("Salin"); // bukan "Tersalin"
    await page.clock.fastForward(2100);
    await expect(kartu.getByRole("status")).toHaveText("");
  });
});

test("QRIS placeholder: gambar termuat, jelas bertanda placeholder, bisa diunduh", async ({
  page,
  request,
}) => {
  await buka(page);
  const kartu = page.getByTestId("qris");
  const img = kartu.getByRole("img");
  await img.scrollIntoViewIfNeeded();
  await expect(img).toHaveAttribute("alt", /placeholder, bukan QRIS asli/);
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  await expect(kartu.getByRole("link", { name: "Unduh gambar" })).toHaveAttribute(
    "download",
    "qris.svg",
  );
  const svg = await (await request.get("/img/qris-placeholder.svg")).text();
  expect(svg).toContain("PLACEHOLDER");
  expect(svg).toContain("Ganti dengan QRIS asli Anda");
});

test("bagian amplop tanpa overflow di 360/768/1280 (nomor panjang membungkus)", async ({
  page,
}) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    await page.locator("#amplop").scrollIntoViewIfNeeded();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(over, `overflow di ${width}px`).toBe(false);
  }
});
