import { existsSync, readFileSync, readdirSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { awasi, buatOrder, buatProduk, idVarian, kodeAcak, query, uniqueIp } from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
const DIR = "e2e-uploads/bukti";
const berkasDi = () => (existsSync(DIR) ? readdirSync(DIR) : []);
/** Tidak ada berkas berbahaya (isi SVG/HTML/PHP/skrip) yang pernah tersimpan di folder bukti — tahan terhadap tes paralel. */
const adaIsiBerbahaya = () =>
  berkasDi().some((f) =>
    /<svg|<\?php|<script|alert\(|^GIF8/m.test(readFileSync(`${DIR}/${f}`, "latin1").slice(0, 4096)),
  );
const bukti = (id: number) =>
  query<{ paymentProof: string }>('SELECT paymentProof FROM "Order" WHERE id = ?', id)[0]!
    .paymentProof;

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

const lacak = (request: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
  request.post("/api/lacak", { data, headers: { "x-forwarded-for": uniqueIp(), ...headers } });
const unggah = (
  request: APIRequestContext,
  fields: {
    kode: string;
    telepon: string;
    berkas?: { name: string; mimeType: string; buffer: Buffer };
  },
  headers: Record<string, string> = {},
) =>
  request.post("/api/lacak/bukti", {
    multipart: {
      kode: fields.kode,
      telepon: fields.telepon,
      ...(fields.berkas ? { berkas: fields.berkas } : {}),
    },
    headers: { "x-forwarded-for": uniqueIp(), ...headers },
  });

test.describe("lacak pesanan (UI)", () => {
  test("alur: checkout → tautan lacak (kode terisi) → cek dengan HP → status & rincian → unggah bukti → ganti bukti (berkas lama dihapus)", async ({
    page,
  }) => {
    const p = buatProduk({ price: 30_000, varian: [{ name: "Standar", stock: 5 }] });
    const peta = await awasi(page);
    await page.goto(`/produk/${p.slug}`);
    await page.getByTestId("tambah-keranjang").click();
    await page.goto("/checkout");
    await page.getByLabel(/Nama lengkap/).fill("Dewi Lestari");
    await page.getByLabel(/No\. HP/).fill("0813-5550-1234");
    await page.getByLabel(/Alamat lengkap/).fill("Jl. Kenanga No. 7, Sleman");
    await page.getByLabel(/Kota/).fill("Yogyakarta");
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    await page.getByTestId("ke-lacak").click();
    await expect(page).toHaveURL(new RegExp(`/lacak\\?kode=${kode}$`));
    await expect(page.getByLabel(/Kode pesanan/)).toHaveValue(kode);
    await page.getByLabel(/No\. HP/).fill("+62 813 5550 1234"); // format berbeda, nomor sama
    await page.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(page.getByTestId("hasil-kode")).toHaveText(kode);
    await expect(page.getByTestId("status-label")).toHaveText("Status: Menunggu pembayaran");
    await expect(page.getByTestId("hasil-total")).toContainText("40.000");
    await expect(page.getByTestId("info-bayar")).toContainText("Bank Nusantara");
    await expect(page.getByTestId("tahapan").locator('[aria-current="step"]')).toHaveText(
      "Menunggu pembayaran",
    );
    // unggah bukti
    await page
      .getByLabel("Unggah bukti bayar")
      .setInputFiles({ name: "transfer.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Kirim bukti" }).click();
    await expect(page.getByTestId("status-bukti")).toContainText("berhasil diunggah");
    await expect(page.getByTestId("bukti-ada")).toBeVisible();
    const id = query<{ id: number }>('SELECT id FROM "Order" WHERE code = ?', kode)[0]!.id;
    const nama1 = bukti(id);
    expect(nama1).toMatch(/^[A-Za-z0-9_-]{16,64}\.png$/);
    expect(nama1).not.toContain("transfer"); // nama dibuat server, bukan dari klien
    expect(readFileSync(`${DIR}/${nama1}`).equals(PNG)).toBe(true);
    // ganti dengan PDF → berkas lama terhapus
    await page
      .getByLabel("Ganti bukti bayar")
      .setInputFiles({ name: "bukti.pdf", mimeType: "application/pdf", buffer: PDF });
    await page.getByRole("button", { name: "Kirim bukti" }).click();
    await expect(page.getByTestId("status-bukti")).toContainText("berhasil");
    await expect.poll(() => bukti(id)).not.toBe(nama1);
    expect(bukti(id)).toMatch(/\.pdf$/);
    expect(existsSync(`${DIR}/${nama1}`)).toBe(false);
    expect(existsSync(`${DIR}/${bukti(id)}`)).toBe(true);
    expect(peta.masalah).toEqual([]);
    expect(peta.luar).toEqual([]);
  });

  test("galat identik untuk kode salah / HP salah / format salah (tidak membocorkan apakah kode ada)", async ({
    page,
  }) => {
    const o = buatOrder();
    const pesan: string[] = [];
    for (const [kode, hp] of [
      [o.kode, "081200000000"],
      [kodeAcak(), o.telepon],
      ["bukan-kode", o.telepon],
      [o.kode, "abc"],
    ] as const) {
      await page.goto("/lacak");
      await page.getByLabel(/Kode pesanan/).fill(kode);
      await page.getByLabel(/No\. HP/).fill(hp);
      await page.getByRole("button", { name: "Cek pesanan" }).click();
      await expect(page.getByTestId("galat-lacak")).toBeVisible();
      pesan.push((await page.getByTestId("galat-lacak").textContent())!);
      await expect(page.getByTestId("hasil-lacak")).toHaveCount(0);
    }
    expect(new Set(pesan).size).toBe(1);
  });

  test("status lain: DIKIRIM menandai tahap & tanpa form unggah; DIBATALKAN; info bayar hanya saat menunggu bayar", async ({
    page,
  }) => {
    for (const [status, label] of [
      ["DIKIRIM", "Dikirim"],
      ["DIBATALKAN", "Dibatalkan"],
      ["SELESAI", "Selesai"],
    ] as const) {
      const o = buatOrder({ status });
      await page.goto(`/lacak?kode=${o.kode}`);
      await page.getByLabel(/No\. HP/).fill(o.telepon);
      await page.getByRole("button", { name: "Cek pesanan" }).click();
      await expect(page.getByTestId("status-label")).toHaveText(`Status: ${label}`);
      await expect(page.getByTestId("info-bayar")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Kirim bukti" })).toHaveCount(0);
      if (status === "DIBATALKAN") await expect(page.getByTestId("status-batal")).toBeVisible();
      else
        await expect(page.getByTestId("tahapan").locator('[aria-current="step"]')).toHaveText(
          label,
        );
    }
  });

  test("data pembeli berisi HTML tampil sebagai teks; a11y & 360px tanpa overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const o = buatOrder({ nama: '<img src=x onerror=window.__xss=1>"Budi"', kota: "K".repeat(80) });
    await page.goto("/lacak");
    await page.getByLabel(/Kode pesanan/).fill(o.kode);
    await page.getByLabel(/No\. HP/).fill(o.telepon);
    await page.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(page.getByTestId("hasil-lacak")).toContainText("<img src=x");
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(await page.locator("main img[src='x']").count()).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const levels = await page
      .locator("h1,h2,h3")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    for (const e of await page.locator("main input:visible").all())
      expect(
        await e.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0),
      ).toBeGreaterThan(0);
  });

  test("kode di URL dinormalkan/dibersihkan (nilai berbahaya tidak dipantulkan)", async ({
    page,
  }) => {
    await page.goto('/lacak?kode="><script>window.__xss=1</script>');
    await expect(page.getByLabel(/Kode pesanan/)).toHaveValue("");
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    await page.goto("/lacak?kode=tko%20k7m2xq4p");
    await expect(page.getByLabel(/Kode pesanan/)).toHaveValue("TKO-K7M2XQ4P");
  });
});

test.describe("keamanan lacak & bukti bayar (API)", () => {
  test("HANYA pemegang kode + HP yang cocok; respons tidak memuat data sensitif (HP, email, alamat, catatan, admin, nama berkas)", async ({
    request,
  }) => {
    const a = buatOrder({
      nama: "Pemilik A",
      adminNote: "internal-jangan-bocor",
      proof: "AbCdEfGhIjKlMnOpQr12.png",
    });
    const b = buatOrder();
    const salah = await lacak(request, { kode: a.kode, telepon: b.telepon }); // HP milik orang lain
    expect(salah.status()).toBe(404);
    expect(JSON.stringify(await salah.json())).not.toContain("Pemilik A");
    expect((await lacak(request, { kode: kodeAcak(), telepon: a.telepon })).status()).toBe(404);
    const ok = await lacak(request, { kode: a.kode.toLowerCase(), telepon: `+${a.telepon}` });
    expect(ok.status()).toBe(200);
    expect(ok.headers()["cache-control"]).toBe("no-store");
    const teks = JSON.stringify(await ok.json());
    for (const rahasia of [
      a.telepon,
      "rahasia@contoh.test",
      "Jl. Rahasia",
      "catatan-pribadi",
      "internal-jangan-bocor",
      "AbCdEfGhIjKlMnOpQr12",
      "adminNote",
      "paymentProof",
    ])
      expect(teks, rahasia).not.toContain(rahasia);
    expect(teks).toContain("Pemilik A");
    expect(JSON.parse(teks).pesanan.buktiAda).toBe(true);
  });

  test("validasi permintaan: properti asing/tipe salah → 400; bukan JSON → 415; Origin lintas-situs → 403; GET → 405", async ({
    request,
  }) => {
    const o = buatOrder();
    for (const bad of [
      {},
      { kode: o.kode },
      { kode: o.kode, telepon: o.telepon, x: 1 },
      { kode: 1, telepon: 2 },
      { kode: "x".repeat(100), telepon: "1" },
      [],
    ])
      expect((await lacak(request, bad)).status(), JSON.stringify(bad)).toBe(400);
    const form = await request.post("/api/lacak", {
      data: "kode=x",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": uniqueIp(),
      },
    });
    expect(form.status()).toBe(415);
    expect(
      (
        await lacak(
          request,
          { kode: o.kode, telepon: o.telepon },
          { origin: "https://evil.example" },
        )
      ).status(),
    ).toBe(403);
    expect((await request.get("/api/lacak")).status()).toBe(405);
    expect((await request.get("/api/lacak/bukti")).status()).toBe(405);
  });

  test("injeksi pada kode/HP tidak menimbulkan error server", async ({ request }) => {
    for (const kode of [
      "' OR '1'='1",
      'TKO-\'; DROP TABLE "Order";--',
      "%",
      "💥",
      "../../etc/passwd",
    ]) {
      const r = await lacak(request, { kode, telepon: "' OR 1=1 --" });
      expect(r.status(), kode).toBe(404);
    }
    expect(query<{ c: number }>('SELECT count(*) c FROM "Order"')[0]!.c).toBeGreaterThan(0);
  });

  test("rate limit: per-kode 8 / 15 mnt (lalu 429 + Retry-After, juga untuk IP lain) dan per-IP 10 / 15 mnt", async ({
    request,
  }) => {
    const o = buatOrder();
    const st: number[] = [];
    let retry = "";
    for (let i = 0; i < 10; i++) {
      const r = await lacak(request, { kode: o.kode, telepon: "081200000000" });
      st.push(r.status());
      if (r.status() === 429) retry = r.headers()["retry-after"] ?? "";
    }
    expect(st.filter((s) => s === 404)).toHaveLength(8);
    expect(st.filter((s) => s === 429)).toHaveLength(2);
    expect(Number(retry)).toBeGreaterThan(0);
    // pemilik asli dari IP lain pun ikut tertahan (konsekuensi yang dicatat di README)
    expect((await lacak(request, { kode: o.kode, telepon: o.telepon })).status()).toBe(429);
    const ip = uniqueIp();
    const st2: number[] = [];
    for (let i = 0; i < 12; i++)
      st2.push(
        (
          await request.post("/api/lacak", {
            data: { kode: kodeAcak(), telepon: "081200000000" },
            headers: { "x-forwarded-for": ip },
          })
        ).status(),
      );
    expect(st2.filter((s) => s === 404)).toHaveLength(10);
    expect(st2.filter((s) => s === 429)).toHaveLength(2);
  });

  test("unggah ke pesanan orang lain / kode salah ditolak (404) — tidak ada berkas & DB tidak berubah", async ({
    request,
  }) => {
    const a = buatOrder();
    const b = buatOrder();
    const r1 = await unggah(request, {
      kode: a.kode,
      telepon: b.telepon,
      berkas: { name: "x.png", mimeType: "image/png", buffer: PNG },
    });
    expect(r1.status()).toBe(404);
    const r2 = await unggah(request, {
      kode: kodeAcak(),
      telepon: a.telepon,
      berkas: { name: "x.png", mimeType: "image/png", buffer: PNG },
    });
    expect(r2.status()).toBe(404);
    expect(bukti(a.id)).toBe("");
    expect(adaIsiBerbahaya()).toBe(false);
  });

  test("unggah hanya saat MENUNGGU_BAYAR: status lain → 409, tidak ada perubahan", async ({
    request,
  }) => {
    for (const status of ["DIBAYAR", "DIPROSES", "DIKIRIM", "SELESAI", "DIBATALKAN"]) {
      const o = buatOrder({ status });
      const r = await unggah(request, {
        kode: o.kode,
        telepon: o.telepon,
        berkas: { name: "x.png", mimeType: "image/png", buffer: PNG },
      });
      expect(r.status(), status).toBe(409);
      expect(bukti(o.id), status).toBe("");
    }
  });

  test("berkas berbahaya ditolak: SVG/HTML/GIF/PHP/EXE/skrip (meski diberi nama .png & MIME image/png), kosong, terlalu besar, MIME tak cocok isi", async ({
    request,
  }) => {
    const o = buatOrder();
    const kasus: Array<[string, Buffer, string, number]> = [
      [
        "svg",
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        "image/png",
        422,
      ],
      ["html", Buffer.from("<!doctype html><script>alert(1)</script>"), "image/png", 422],
      ["gif", Buffer.from("GIF89a\x01\x00\x01\x00"), "image/png", 422],
      ["php", Buffer.from("<?php system($_GET[1]); ?>"), "image/png", 422],
      ["exe", Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]), "image/png", 422],
      ["js", Buffer.from("alert(document.cookie)"), "application/pdf", 422],
      ["kosong", Buffer.alloc(0), "image/png", 422],
      ["png-diklaim-pdf", PNG, "application/pdf", 422],
      ["pdf-diklaim-png", PDF, "image/png", 422],
      [
        "2.01MB",
        Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024 + 1, 0x20)]),
        "application/pdf",
        422,
      ],
    ];
    const orders: Array<{ id: number }> = [o];
    for (const [nama, buffer, mimeType, status] of kasus) {
      // pesanan baru per kasus: batas unggah per-kode (5/jam) tidak boleh menutupi penolakan yang sedang diuji
      const x = buatOrder();
      orders.push(x);
      const r = await unggah(request, {
        kode: x.kode,
        telepon: x.telepon,
        berkas: { name: `${nama}.png`, mimeType, buffer },
      });
      expect(r.status(), nama).toBe(status);
    }
    const raksasa = await unggah(request, {
      kode: o.kode,
      telepon: o.telepon,
      berkas: {
        name: "besar.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.concat([PDF, Buffer.alloc(3 * 1024 * 1024)]),
      },
    });
    expect(raksasa.status()).toBe(413);
    const tanpa = await unggah(request, { kode: o.kode, telepon: o.telepon });
    expect(tanpa.status()).toBe(400);
    for (const x of orders) expect(bukti(x.id)).toBe("");
    expect(adaIsiBerbahaya()).toBe(false);
  });

  test("CSRF & tipe: Origin lintas-situs 403, bukan multipart 415; bukti tak bisa diambil lewat URL publik mana pun", async ({
    request,
  }) => {
    const o = buatOrder();
    const berkas = { name: "x.png", mimeType: "image/png", buffer: PNG };
    expect(
      (
        await unggah(
          request,
          { kode: o.kode, telepon: o.telepon, berkas },
          { origin: "https://evil.example" },
        )
      ).status(),
    ).toBe(403);
    const json = await request.post("/api/lacak/bukti", {
      data: { kode: o.kode },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    expect(json.status()).toBe(415);
    // unggah yang sah, lalu pastikan berkasnya tidak bisa dibuka lewat jalur publik
    const ok = await unggah(request, { kode: o.kode, telepon: o.telepon, berkas });
    expect(ok.status()).toBe(200);
    const nama = bukti(o.id);
    for (const u of [
      `/uploads/${nama}`,
      `/uploads/bukti/${nama}`,
      `/bukti/${nama}`,
      `/api/lacak/bukti/${nama}`,
      `/img/${nama}`,
      `/${nama}`,
      `/uploads/../bukti/${nama}`,
    ]) {
      const r = await request.get(u);
      expect([404, 405], u).toContain(r.status());
    }
  });

  test("rate limit unggah: 5 / jam / kode lalu 429; batas per-IP 5 / jam", async ({ request }) => {
    const o = buatOrder();
    const berkas = { name: "x.png", mimeType: "image/png", buffer: PNG };
    const st: number[] = [];
    for (let i = 0; i < 7; i++)
      st.push((await unggah(request, { kode: o.kode, telepon: o.telepon, berkas })).status());
    expect(st.filter((s) => s === 200)).toHaveLength(5);
    expect(st.filter((s) => s === 429)).toHaveLength(2);
    // hanya satu berkas tersisa untuk pesanan ini (yang lama selalu dihapus saat diganti)
    expect(berkasDi()).toContain(bukti(o.id));
    const ip = uniqueIp();
    const o2 = buatOrder();
    const st2: number[] = [];
    for (let i = 0; i < 7; i++)
      st2.push(
        (
          await request.post("/api/lacak/bukti", {
            multipart: { kode: o2.kode, telepon: "081200000000", berkas },
            headers: { "x-forwarded-for": ip },
          })
        ).status(),
      );
    expect(st2.filter((s) => s === 404)).toHaveLength(5);
    expect(st2.filter((s) => s === 429)).toHaveLength(2);
  });

  test("unggah ganda bersamaan ke satu pesanan: tepat satu berkas tersisa & dirujuk DB (tanpa berkas yatim)", async ({
    request,
  }) => {
    const o = buatOrder();
    const berkas = { name: "x.png", mimeType: "image/png", buffer: PNG };
    const sebelum = new Set(berkasDi());
    const rs = await Promise.all(
      [1, 2, 3].map(() => unggah(request, { kode: o.kode, telepon: o.telepon, berkas })),
    );
    expect(rs.map((r) => r.status()).every((s) => s === 200)).toBe(true);
    const baru = berkasDi().filter((f) => !sebelum.has(f) && f === bukti(o.id));
    expect(baru).toHaveLength(1);
    expect(existsSync(`${DIR}/${bukti(o.id)}`)).toBe(true);
  });
});

test("pesanan dari checkout yang lain tidak bisa dilacak dengan HP berbeda (alur nyata)", async ({
  request,
}) => {
  const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 5 }] });
  const [vid] = idVarian(p.id);
  const hp = "081355509999";
  const items = [{ varianId: vid!, qty: 1 }];
  const ring = await request.post("/api/checkout/ringkasan", {
    data: { items, kota: "Yogyakarta" },
    headers: { "x-forwarded-for": uniqueIp() },
  });
  const total = (await ring.json()).ringkasan.total;
  const r = await request.post("/api/pesanan", {
    data: {
      kunci: "k".repeat(32),
      items,
      nama: "Rina Wati",
      telepon: hp,
      alamat: "Jl. Melati No. 3, Sleman",
      kota: "Yogyakarta",
      totalPreview: total,
    },
    headers: { "x-forwarded-for": uniqueIp() },
  });
  const { kode } = await r.json();
  expect((await lacak(request, { kode, telepon: "081355500000" })).status()).toBe(404);
  expect((await lacak(request, { kode, telepon: hp })).status()).toBe(200);
});
