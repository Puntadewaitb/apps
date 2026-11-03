import { expect, test, type Page } from "@playwright/test";
import { angka, awasi, buatProduk, tulis, uniqueIp, varianIds } from "./helpers";

test.beforeEach(async ({ page }) => {
  // IP unik per tes → batas laju /api/keranjang tidak dibagi antar tes paralel
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

const badge = (page: Page) => page.getByTestId("jumlah-keranjang");
const baris = (page: Page) => page.getByTestId("baris-keranjang");
const setStorage = async (page: Page, nilai: unknown) => {
  await page.goto("/");
  await page.evaluate(
    (v) => localStorage.setItem("toko.keranjang.v1", typeof v === "string" ? v : JSON.stringify(v)),
    nilai,
  );
};
const tambahDariDetail = async (page: Page, slug: string, jumlah = 1) => {
  await page.goto(`/produk/${slug}`);
  if (jumlah > 1) await page.getByLabel("Jumlah", { exact: true }).fill(String(jumlah));
  await page.getByTestId("tambah-keranjang").click();
};

test.describe("tambah ke keranjang", () => {
  test("tambah dari detail: pesan, badge navbar, tersimpan setelah reload; keranjang menampilkan harga dari server", async ({
    page,
  }) => {
    const p = buatProduk({ price: 12_500, varian: [{ name: "Standar", stock: 20 }] });
    const peta = await awasi(page);
    await tambahDariDetail(page, p.slug, 3);
    await expect(page.getByTestId("pesan-keranjang")).toContainText(`3 × ${p.name} ditambahkan`);
    await expect(badge(page)).toHaveText("3");
    await expect(
      page.getByTestId("pesan-keranjang").getByRole("link", { name: "Lihat keranjang" }),
    ).toHaveAttribute("href", "/keranjang");
    await expect(page.getByTestId("tombol-keranjang")).toHaveAccessibleName("Keranjang, 3 item");
    await page.reload();
    await expect(badge(page)).toHaveText("3"); // persist localStorage
    await page.goto("/keranjang");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keranjang Belanja");
    await expect(baris(page)).toHaveCount(1);
    await expect(baris(page)).toContainText(p.name);
    await expect(page.getByTestId("harga-satuan")).toContainText("12.500");
    await expect(page.getByTestId("subtotal-baris")).toContainText("37.500");
    await expect(page.getByTestId("subtotal")).toContainText("37.500");
    await expect(page.getByTestId("jumlah-barang")).toHaveText("3");
    expect(peta.masalah).toEqual([]);
    expect(peta.gagal).toEqual([]);
  });

  test("varian berbeda = baris berbeda; varian sama digabung; harga varian override dipakai", async ({
    page,
  }) => {
    const [m, , xl] = varianIds("kemeja-batik-cap-pria");
    expect(m).toBeDefined();
    await page.goto("/produk/kemeja-batik-cap-pria");
    await page.getByTestId("tambah-keranjang").click();
    await page.getByTestId("tambah-keranjang").click(); // varian M ×2 → satu baris
    await page.getByText("XL", { exact: true }).click();
    await page.getByTestId("tambah-keranjang").click();
    await expect(badge(page)).toHaveText("3");
    await page.goto("/keranjang");
    await expect(baris(page)).toHaveCount(2);
    await expect(baris(page).nth(0).getByTestId("subtotal-baris")).toContainText("370.000"); // 2 × 185.000
    await expect(baris(page).nth(1).getByTestId("harga-satuan")).toContainText("195.000"); // override XL
    await expect(page.getByTestId("subtotal")).toContainText("565.000");
    expect(xl).toBeDefined();
  });

  test("dibatasi stok: penambahan melebihi stok dipotong dan diberi tahu; tombol/field mengikuti stok", async ({
    page,
  }) => {
    const p = buatProduk({ varian: [{ name: "Standar", stock: 3 }] });
    await page.goto(`/produk/${p.slug}`);
    const jumlah = page.getByLabel("Jumlah", { exact: true });
    await jumlah.fill("99");
    await jumlah.blur();
    await expect(jumlah).toHaveValue("3"); // dijepit ke stok
    await page.getByTestId("tambah-keranjang").click();
    await expect(badge(page)).toHaveText("3");
    await page.getByTestId("tambah-keranjang").click();
    await expect(page.getByTestId("pesan-keranjang")).toContainText("sudah mencapai stok (3)");
    await expect(badge(page)).toHaveText("3");
    // nilai aneh di field → dinormalkan
    for (const [ketik, hasil] of [
      ["0", "1"],
      ["-5", "1"],
      ["2.7", "2"],
    ] as const) {
      await jumlah.fill(ketik);
      await jumlah.blur();
      await expect(jumlah, ketik).toHaveValue(hasil);
    }
  });

  test("stok habis: tombol nonaktif; tidak bisa ditambahkan", async ({ page }) => {
    const p = buatProduk({ varian: [{ name: "Standar", stock: 0 }] });
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByTestId("tambah-keranjang")).toBeDisabled();
    await expect(page.getByTestId("tambah-keranjang")).toHaveText("Stok habis");
    await expect(page.getByLabel("Jumlah", { exact: true })).toBeDisabled();
    await expect(badge(page)).toHaveCount(0);
  });

  test("ganti varian mereset jumlah & pesan; tombol +/− bekerja dalam batas stok", async ({
    page,
  }) => {
    const p = buatProduk({
      varian: [
        { name: "A", stock: 2 },
        { name: "B", stock: 8 },
      ],
    });
    await page.goto(`/produk/${p.slug}`);
    const jumlah = page.getByLabel("Jumlah", { exact: true });
    await page.getByRole("button", { name: "Tambah jumlah" }).click();
    await expect(jumlah).toHaveValue("2");
    await expect(page.getByRole("button", { name: "Tambah jumlah" })).toBeDisabled(); // stok A = 2
    await page.getByTestId("tambah-keranjang").click();
    await expect(page.getByTestId("pesan-keranjang")).not.toBeEmpty();
    await page.getByText("B", { exact: true }).click();
    await expect(jumlah).toHaveValue("1");
    await expect(page.getByTestId("pesan-keranjang")).toBeEmpty();
    await expect(page.getByRole("button", { name: "Kurangi jumlah" })).toBeDisabled();
  });
});

test.describe("halaman keranjang", () => {
  test("ubah jumlah (+, −, ketik), subtotal ikut berubah, dijepit 1..stok; tersimpan", async ({
    page,
  }) => {
    const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 6 }] });
    await tambahDariDetail(page, p.slug, 2);
    await page.goto("/keranjang");
    const qty = page.getByRole("spinbutton", { name: new RegExp(`Jumlah ${p.name}`) });
    await expect(qty).toHaveValue("2");
    await page.getByRole("button", { name: /Tambah jumlah/ }).click();
    await expect(qty).toHaveValue("3");
    await expect(page.getByTestId("subtotal")).toContainText("30.000");
    await expect(badge(page)).toHaveText("3");
    await page.getByRole("button", { name: /Kurangi jumlah/ }).click();
    await expect(qty).toHaveValue("2");
    await qty.fill("5");
    await qty.press("Enter");
    await expect(page.getByTestId("subtotal")).toContainText("50.000");
    await qty.fill("500");
    await qty.blur();
    await expect(qty).toHaveValue("6"); // stok
    await expect(page.getByTestId("subtotal")).toContainText("60.000");
    await expect(page.getByRole("button", { name: /Tambah jumlah/ })).toBeDisabled();
    for (const k of ["0", "-3", ""]) {
      await qty.fill(k);
      await qty.blur();
      await expect(qty, `"${k}"`).toHaveValue("1");
    }
    await expect(page.getByRole("button", { name: /Kurangi jumlah/ })).toBeDisabled();
    await page.reload();
    await expect(qty).toHaveValue("1");
    await expect(badge(page)).toHaveText("1");
  });

  test("hapus satu item, lalu kosongkan keranjang (dengan konfirmasi) → keadaan kosong", async ({
    page,
  }) => {
    const a = buatProduk({ price: 1_000 });
    const b = buatProduk({ price: 2_000 });
    await tambahDariDetail(page, a.slug);
    await tambahDariDetail(page, b.slug);
    await page.goto("/keranjang");
    await expect(baris(page)).toHaveCount(2);
    await page.getByRole("button", { name: new RegExp(`Hapus ${a.name}`) }).click();
    await expect(baris(page)).toHaveCount(1);
    await expect(baris(page)).toContainText(b.name);
    await expect(page.getByTestId("subtotal")).toContainText("2.000");
    // batal konfirmasi → tidak terhapus
    page.once("dialog", (d) => void d.dismiss());
    await page.getByRole("button", { name: "Kosongkan keranjang" }).click();
    await expect(baris(page)).toHaveCount(1);
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Kosongkan keranjang" }).click();
    await expect(page.getByTestId("keranjang-kosong")).toBeVisible();
    await expect(page.getByRole("link", { name: "Mulai belanja" })).toHaveAttribute(
      "href",
      "/produk",
    );
    await expect(badge(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("toko.keranjang.v1"))).toBeNull();
  });

  test("keranjang kosong dari awal; tombol checkout menuju /checkout bila ada barang", async ({
    page,
  }) => {
    await page.goto("/keranjang");
    await expect(page.getByTestId("keranjang-kosong")).toBeVisible();
    await expect(page.getByTestId("ke-checkout")).toHaveCount(0);
    const p = buatProduk();
    await tambahDariDetail(page, p.slug);
    await page.goto("/keranjang");
    await expect(page.getByTestId("ke-checkout")).toHaveAttribute("href", "/checkout");
  });

  test("antar-tab: perubahan di satu tab langsung terlihat di tab lain (event storage)", async ({
    context,
  }) => {
    const ip = uniqueIp();
    const a = await context.newPage();
    await a.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    const b = await context.newPage();
    await b.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    const p = buatProduk();
    await a.goto("/");
    await b.goto("/");
    await expect(badge(b)).toHaveCount(0);
    await tambahDariDetail(a, p.slug, 2);
    await expect(badge(b)).toHaveText("2");
  });

  test("noindex & tanpa error konsol; halaman tidak diindeks", async ({ page }) => {
    const peta = await awasi(page);
    await page.goto("/keranjang");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(peta.masalah).toEqual([]);
  });
});

test.describe("mini-cart", () => {
  test("buka: daftar item + subtotal + tautan; Esc menutup dan fokus kembali; klik di luar menutup", async ({
    page,
  }) => {
    const p = buatProduk({ price: 7_000, varian: [{ name: "Standar", stock: 10 }] });
    await tambahDariDetail(page, p.slug, 2);
    const tombol = page.getByTestId("tombol-keranjang");
    await tombol.click();
    const mini = page.getByRole("region", { name: "Ringkasan keranjang" });
    await expect(mini).toBeVisible();
    await expect(tombol).toHaveAttribute("aria-expanded", "true");
    await expect(mini).toContainText(p.name);
    await expect(mini).toContainText("2 ×");
    await expect(page.getByTestId("mini-subtotal")).toContainText("14.000");
    await page.keyboard.press("Escape");
    await expect(mini).toHaveCount(0);
    await expect(tombol).toBeFocused();
    await tombol.click();
    await expect(mini).toBeVisible();
    await page.mouse.click(5, 500); // klik di luar panel
    await expect(mini).toHaveCount(0);
    await tombol.click();
    await mini.getByRole("link", { name: "Lihat keranjang" }).click();
    await expect(page).toHaveURL(/\/keranjang$/);
  });

  test("keranjang kosong: pesan kosong; badge tidak tampil", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tombol-keranjang").click();
    await expect(page.getByTestId("mini-cart")).toContainText("Keranjang masih kosong");
    await expect(badge(page)).toHaveCount(0);
  });

  test("terlihat & bisa dipakai di layar 360px (di luar menu hamburger) tanpa overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const p = buatProduk({ name: `Panjang${"X".repeat(100)}` });
    await tambahDariDetail(page, p.slug);
    await expect(page.getByTestId("tombol-keranjang")).toBeVisible();
    await page.getByTestId("tombol-keranjang").click();
    const kotak = await page.getByTestId("mini-cart").boundingBox();
    expect(kotak!.x).toBeGreaterThanOrEqual(0);
    expect(kotak!.x + kotak!.width).toBeLessThanOrEqual(360);
    for (const u of ["/", "/keranjang", `/produk/${p.slug}`]) {
      await page.goto(u);
      const lebih = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(lebih, u).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("keranjang tidak tepercaya: isi localStorage & perubahan data di server", () => {
  test("harga/properti palsu di localStorage diabaikan: total selalu dari DB", async ({ page }) => {
    const p = buatProduk({ price: 50_000, varian: [{ name: "Standar", stock: 9 }] });
    const [vid] = tulis((d) =>
      (d.prepare("SELECT id FROM Variant WHERE productId = ?").all(p.id) as { id: number }[]).map(
        (r) => r.id,
      ),
    );
    await setStorage(page, [{ varianId: vid, qty: 2, harga: 1, price: 1, total: 1, stok: 9999 }]);
    await page.goto("/keranjang");
    await expect(page.getByTestId("harga-satuan")).toContainText("50.000");
    await expect(page.getByTestId("subtotal")).toContainText("100.000");
    expect(angka((await page.getByTestId("subtotal").textContent())!)).toBe(100_000);
  });

  test("data rusak: JSON rusak, tipe salah, qty negatif/pecahan/besar, id fiktif → tidak error, dibersihkan/diberi label", async ({
    page,
  }) => {
    const peta = await awasi(page);
    for (const rusak of [
      "{rusak",
      "null",
      '"x"',
      "[1,2,3]",
      '[{"varianId":"1","qty":"2"}]',
      '[{"varianId":1,"qty":-3}]',
      '[{"varianId":1,"qty":1.5}]',
    ]) {
      await setStorage(page, rusak);
      await page.goto("/keranjang");
      await expect(page.getByTestId("keranjang-kosong"), rusak).toBeVisible();
    }
    // id fiktif: tampil "tidak tersedia", tidak dihitung
    await setStorage(page, [{ varianId: 99_999_999, qty: 2 }]);
    await page.goto("/keranjang");
    await expect(baris(page)).toHaveAttribute("data-status", "tidak-tersedia");
    await expect(page.getByTestId("jumlah-barang")).toHaveText("0");
    await expect(page.getByTestId("subtotal")).toContainText("0");
    await expect(page.getByTestId("ke-checkout")).toHaveCount(0);
    await page.getByRole("button", { name: "Hapus dari keranjang" }).click();
    await expect(page.getByTestId("keranjang-kosong")).toBeVisible();
    // qty raksasa dijepit
    const p = buatProduk({ varian: [{ name: "Standar", stock: 500 }] });
    const vid = tulis(
      (d) =>
        (d.prepare("SELECT id FROM Variant WHERE productId = ?").get(p.id) as { id: number }).id,
    );
    await setStorage(page, [{ varianId: vid, qty: 123_456_789 }]);
    await page.goto("/keranjang");
    await expect(page.getByRole("spinbutton")).toHaveValue("99");
    expect(peta.masalah).toEqual([]);
  });

  test("produk dinonaktifkan setelah masuk keranjang → 'Tidak tersedia', tidak dihitung, nama tidak bocor", async ({
    page,
  }) => {
    const p = buatProduk({ name: `Akan Mati ${Date.now()}`, price: 40_000 });
    await tambahDariDetail(page, p.slug, 2);
    await page.goto("/keranjang");
    await expect(page.getByTestId("subtotal")).toContainText("80.000");
    tulis((d) => d.prepare("UPDATE Product SET active = 0 WHERE id = ?").run(p.id));
    await page.reload();
    await expect(baris(page)).toHaveAttribute("data-status", "tidak-tersedia");
    await expect(page.getByText(p.name)).toHaveCount(0);
    await expect(page.getByTestId("subtotal")).toContainText("0");
    await expect(page.getByTestId("ke-checkout")).toHaveCount(0);
  });

  test("harga berubah di server → keranjang memakai harga baru, bukan harga saat ditambahkan", async ({
    page,
  }) => {
    const p = buatProduk({ price: 20_000 });
    await tambahDariDetail(page, p.slug);
    tulis((d) => d.prepare("UPDATE Product SET price = 35000 WHERE id = ?").run(p.id));
    await page.goto("/keranjang");
    await expect(page.getByTestId("harga-satuan")).toContainText("35.000");
    await expect(page.getByTestId("subtotal")).toContainText("35.000");
  });

  test("stok turun di server → jumlah dijepit + pesan; stok habis → tidak dihitung", async ({
    page,
  }) => {
    const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 10 }] });
    await tambahDariDetail(page, p.slug, 8);
    tulis((d) => d.prepare("UPDATE Variant SET stock = 3 WHERE productId = ?").run(p.id));
    await page.goto("/keranjang");
    await expect(page.getByRole("spinbutton")).toHaveValue("3");
    await expect(page.getByTestId("subtotal")).toContainText("30.000");
    await expect(badge(page)).toHaveText("3"); // penyimpanan dirapikan
    tulis((d) => d.prepare("UPDATE Variant SET stock = 0 WHERE productId = ?").run(p.id));
    await page.reload();
    await expect(baris(page)).toHaveAttribute("data-status", "habis");
    await expect(page.getByText("Stok habis — tidak ikut dihitung.")).toBeVisible();
    await expect(page.getByTestId("jumlah-barang")).toHaveText("0");
    await expect(page.getByTestId("ke-checkout")).toHaveCount(0);
  });

  test("nama produk berisi HTML tampil sebagai teks (keranjang & mini-cart); tidak ada skrip jalan", async ({
    page,
  }) => {
    const jahat = `<img src=x onerror=window.__xss=1><script>window.__xss=1</script>`;
    const p = buatProduk({ name: jahat });
    await tambahDariDetail(page, p.slug);
    await page.goto("/keranjang");
    await expect(baris(page)).toContainText("<img src=x");
    await page.getByTestId("tombol-keranjang").click();
    await expect(page.getByTestId("mini-cart")).toContainText("<script>");
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(
      await page.locator("main img[src='x'], [data-testid=mini-cart] img[src='x']").count(),
    ).toBe(0);
  });
});

test.describe("API /api/keranjang", () => {
  const post = (
    request: import("@playwright/test").APIRequestContext,
    data: unknown,
    headers: Record<string, string> = {},
  ) =>
    request.post("/api/keranjang", {
      data,
      headers: { "x-forwarded-for": uniqueIp(), ...headers },
    });

  test("detail dari DB; nonaktif/tidak ada → tersedia:false tanpa nama/harga; no-store; duplikat digabung", async ({
    request,
  }) => {
    const aktif = buatProduk({
      name: `Aktif ${Date.now()}`,
      price: 15_000,
      varian: [{ name: "Std", stock: 7 }],
    });
    const mati = buatProduk({ name: `Mati ${Date.now()}`, active: false });
    const ids = tulis((d) => ({
      aktif: (
        d.prepare("SELECT id FROM Variant WHERE productId = ?").get(aktif.id) as { id: number }
      ).id,
      mati: (d.prepare("SELECT id FROM Variant WHERE productId = ?").get(mati.id) as { id: number })
        .id,
    }));
    const r = await post(request, { ids: [ids.aktif, ids.mati, 99_999_999, ids.aktif] });
    expect(r.status()).toBe(200);
    expect(r.headers()["cache-control"]).toBe("no-store");
    const j = (await r.json()) as { items: Array<Record<string, unknown>> };
    expect(j.items).toHaveLength(3);
    expect(j.items[0]).toMatchObject({
      varianId: ids.aktif,
      tersedia: true,
      produkNama: aktif.name,
      harga: 15_000,
      stok: 7,
      varianNama: "Std",
    });
    expect(j.items[1]).toEqual({ varianId: ids.mati, tersedia: false });
    expect(j.items[2]).toEqual({ varianId: 99_999_999, tersedia: false });
    expect(JSON.stringify(j)).not.toContain(mati.name);
    expect((await (await post(request, { ids: [] })).json()).items).toEqual([]);
  });

  test("validasi: body salah → 400; bukan JSON → 415; terlalu besar → 413; GET → 405", async ({
    request,
  }) => {
    for (const bad of [
      {},
      { ids: "1" },
      { ids: [1.5] },
      { ids: [-1] },
      { ids: [0] },
      { ids: ["1"] },
      { ids: [1], extra: 1 },
      { ids: Array.from({ length: 51 }, (_, i) => i + 1) },
      { ids: [99999999999] },
      [1, 2],
      "x",
      null,
    ]) {
      const r = await post(request, JSON.stringify(bad), { "content-type": "application/json" });
      expect(r.status(), JSON.stringify(bad).slice(0, 60)).toBe(400);
    }
    const bukanJson = await request.post("/api/keranjang", {
      data: "ids=1",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": uniqueIp(),
      },
    });
    expect(bukanJson.status()).toBe(415);
    const teksPolos = await request.post("/api/keranjang", {
      data: "{rusak",
      headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
    });
    expect(teksPolos.status()).toBe(400);
    const besar = await request.post("/api/keranjang", {
      data: JSON.stringify({ ids: [1], x: "a".repeat(10_000) }),
      headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
    });
    expect(besar.status()).toBe(413);
    const get = await request.get("/api/keranjang");
    expect(get.status()).toBe(405);
    expect(get.headers()["allow"]).toBe("POST");
  });

  test("rate limit per IP: lewat batas → 429 + Retry-After; IP lain tidak terdampak", async ({
    request,
  }) => {
    const ip = uniqueIp();
    let kena = 0;
    let retry = "";
    for (let i = 0; i < 125; i++) {
      const r = await request.post("/api/keranjang", {
        data: { ids: [1] },
        headers: { "x-forwarded-for": ip },
      });
      if (r.status() === 429) {
        kena++;
        retry = r.headers()["retry-after"] ?? "";
      }
    }
    expect(kena).toBeGreaterThan(0);
    expect(Number(retry)).toBeGreaterThan(0);
    expect((await post(request, { ids: [1] })).status()).toBe(200);
  });

  test("tidak mengubah data: tidak ada order/stok yang berubah akibat panggilan API", async ({
    request,
  }) => {
    const p = buatProduk({ varian: [{ name: "Std", stock: 7 }] });
    const id = tulis(
      (d) =>
        (d.prepare("SELECT id FROM Variant WHERE productId = ?").get(p.id) as { id: number }).id,
    );
    await post(request, { ids: [id] });
    const stok = tulis(
      (d) =>
        (d.prepare("SELECT stock FROM Variant WHERE id = ?").get(id) as { stock: number }).stock,
    );
    expect(stok).toBe(7);
  });
});

test.describe("kualitas keranjang", () => {
  test("a11y: heading berurutan, kontrol berlabel, bisa dioperasikan dengan keyboard", async ({
    page,
  }) => {
    const p = buatProduk({ price: 1_000, varian: [{ name: "Standar", stock: 9 }] });
    await tambahDariDetail(page, p.slug, 2);
    await page.goto("/keranjang");
    const levels = await page
      .locator("h1,h2,h3")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0]).toBe(1);
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    for (const b of await page.locator("main button, main input").all()) {
      const nama = (await b.getAttribute("aria-label")) ?? (await b.textContent())?.trim();
      expect(nama, await b.evaluate((e) => e.outerHTML.slice(0, 80))).toBeTruthy();
    }
    const qty = page.getByRole("spinbutton");
    await qty.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /Tambah jumlah/ })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(qty).toHaveValue("3");
    await expect(page.locator("img:not([alt])")).toHaveCount(0);
  });

  test("tidak ada permintaan ke luar & CSP aman di alur penuh", async ({ page }) => {
    const peta = await awasi(page);
    const p = buatProduk();
    await tambahDariDetail(page, p.slug);
    await page.goto("/keranjang");
    await page.getByTestId("tombol-keranjang").click();
    await page.waitForLoadState("networkidle");
    expect(peta.masalah).toEqual([]);
    expect(peta.luar).toEqual([]);
    expect(peta.gagal).toEqual([]);
  });
});
