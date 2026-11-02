import { expect, test } from "@playwright/test";
import { profil } from "../content/profil";
import { program } from "../content/program";
import { sekolah } from "../content/sekolah";
import { teachers } from "../prisma/seed-data";
import { awasi, huruf, query, tulis } from "./helpers";

const HALAMAN = ["/", "/profil", "/guru", "/program"];

test.describe("navigasi", () => {
  test("menu utama memuat semua halaman S2 dengan href benar; klik berpindah halaman", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    for (const n of sekolah.nav)
      await expect(nav.getByRole("link", { name: n.label, exact: true })).toHaveAttribute(
        "href",
        n.href,
      );
    await nav.getByRole("link", { name: "Profil" }).click();
    await expect(page).toHaveURL(/\/profil$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(profil.judul);
    await nav.getByRole("link", { name: "Program" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(program.judul);
  });

  test("semua tautan internal dari setiap halaman valid (tidak 404)", async ({ page, request }) => {
    await awasi(page);
    const dilihat = new Set<string>();
    for (const p of HALAMAN) {
      await page.goto(p);
      for (const h of await page
        .locator('a[href^="/"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")!)))
        dilihat.add(h.split("#")[0]!.split("?")[0]!);
      for (const a of await page
        .locator('a[href^="#"]')
        .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]))
        if (a !== "#") await expect(page.locator(a), `${p} ${a}`).toHaveCount(1);
    }
    for (const h of dilihat) {
      if (/^\/(img\/|icon\.svg)/.test(h)) continue;
      expect((await request.get(h || "/")).status(), h).toBe(200);
    }
    for (const n of sekolah.nav) expect(dilihat.has(n.href), n.href).toBe(true);
  });
});

test.describe("beranda", () => {
  test("angka dari data (guru dihitung dari DB), program unggulan, sambutan, CTA WhatsApp", async ({
    page,
  }) => {
    await page.goto("/");
    const angka = page.getByTestId("angka");
    await expect(angka).toContainText(String(sekolah.siswa));
    await expect(angka).toContainText("Akreditasi");
    const aktif = query<{ c: number }>("SELECT count(*) c FROM Teacher WHERE active = 1")[0]!.c;
    await expect(angka.locator("div", { hasText: "Guru & staf" })).toContainText(String(aktif));
    await expect(angka.locator("div", { hasText: "Ekstrakurikuler" })).toContainText(
      String(program.ekstrakurikuler.daftar.length),
    );
    await expect(page.getByTestId("kartu-program")).toHaveCount(program.akademik.daftar.length);
    await expect(page.locator("#sambutan")).toContainText(profil.sambutan.nama);
    await expect(
      page.locator("main").getByRole("link", { name: "Hubungi via WhatsApp" }),
    ).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${sekolah.kontak.whatsapp}\\?text=`));
  });
});

test.describe("profil", () => {
  test("sambutan, visi, misi berurutan, sejarah kronologis, struktur organisasi bersarang", async ({
    page,
  }) => {
    await page.goto("/profil");
    await expect(page).toHaveTitle(`${profil.judul} | ${sekolah.nama}`);
    await expect(page.getByTestId("visi")).toHaveText(profil.visiMisi.visi);
    await expect(page.getByTestId("misi").locator("li")).toHaveText(profil.visiMisi.misi);
    await expect(page.getByTestId("peristiwa").locator("time")).toHaveText(
      profil.sejarah.peristiwa.map((p) => p.tahun),
    );
    const tahun = profil.sejarah.peristiwa.map((p) => Number(p.tahun));
    expect([...tahun].sort((a, b) => a - b)).toEqual(tahun);

    const node = page.getByTestId("node-struktur");
    const hitung = (n: typeof profil.struktur.akar): number =>
      1 + n.anak.reduce((a, c) => a + hitung(c), 0);
    await expect(node).toHaveCount(hitung(profil.struktur.akar));
    await expect(node.first()).toHaveAttribute("data-level", "0");
    await expect(node.first()).toContainText(profil.struktur.akar.jabatan);
    // Kepala Sekolah adalah anak Ketua Yayasan (level 1); wakil di level 2
    await expect(
      page
        .locator('[data-testid="node-struktur"][data-level="1"]', { hasText: "Kepala Sekolah" })
        .first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="node-struktur"][data-level="2"]', {
        hasText: "Wakil Kepala Bidang Kurikulum",
      }),
    ).toBeVisible();
  });

  test("lokasi: info kontak, embed Maps (src/title/sandbox diperiksa tanpa memuatnya), CSP frame-src", async ({
    page,
  }) => {
    await awasi(page);
    await page.goto("/profil");
    const info = page.getByTestId("info-kontak");
    await expect(info).toContainText(sekolah.kontak.alamat);
    await expect(info.getByRole("link", { name: sekolah.kontak.email })).toHaveAttribute(
      "href",
      `mailto:${sekolah.kontak.email}`,
    );
    const frame = page.locator("main iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("src", profil.lokasi.mapsUrl);
    await expect(frame).toHaveAttribute("title", /Peta lokasi/);
    await expect(frame).toHaveAttribute("loading", "lazy");
    await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
    const csp = (await page.request.get("/profil")).headers()["content-security-policy"]!;
    expect(csp).toContain("frame-src https://www.google.com;");
    await expect(page.getByRole("link", { name: "Buka di Google Maps" })).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
    );
  });
});

test.describe("guru & staf", () => {
  test("daftar dari DB berurutan sesuai kolom sort; nonaktif tidak tampil", async ({ page }) => {
    const nama = `Guru Nonaktif ${huruf()}`;
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Teacher (name, position, subject, bio, photo, sort, active) VALUES (?, 'Guru', '', '', '', 99, 0)",
        )
        .run(nama),
    );
    await page.goto("/guru");
    const urut = [...teachers].sort((a, b) => a.sort - b.sort).map((t) => t.name);
    await expect(page.getByTestId("kartu-guru").locator("h2")).toHaveText(urut);
    await expect(page.locator("body")).not.toContainText(nama);
    const pertama = page.getByTestId("kartu-guru").first();
    await expect(pertama).toContainText(teachers[0]!.position);
    const foto = pertama.locator("img");
    await expect(foto).toHaveAttribute("alt", /Foto .* \(placeholder\)/);
    expect(await foto.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(
      true,
    );
  });
});

test.describe("program & ekstrakurikuler", () => {
  test("program akademik & ekskul dikelompokkan per kategori sesuai konten", async ({ page }) => {
    await page.goto("/program");
    await expect(page.getByTestId("program-akademik")).toHaveCount(program.akademik.daftar.length);
    for (const k of program.ekstrakurikuler.kategori) {
      const grup = page.locator(`[data-testid="kategori-ekskul"][data-kategori="${k.id}"]`);
      await expect(grup.getByTestId("kartu-ekskul")).toHaveCount(
        program.ekstrakurikuler.daftar.filter((e) => e.kategori === k.id).length,
      );
    }
    const futsal = page.getByTestId("kartu-ekskul").filter({ hasText: "Futsal" });
    await expect(futsal).toContainText("Selasa & Kamis");
  });
});

test.describe("kualitas dasar", () => {
  test("tanpa overflow horizontal di 360/768/1280; tanpa error konsol/CSP/aset rusak/permintaan luar", async ({
    page,
  }) => {
    const p = await awasi(page);
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const h of HALAMAN) {
        await page.goto(h);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(over, `${h} @${width}`).toBe(false);
      }
    }
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
    expect(p.gagal, p.gagal.join("\n")).toEqual([]);
    expect(p.luar, p.luar.join("\n")).toEqual([]);
  });

  test("a11y: satu h1, heading tanpa lompat level, landmark, judul unik, alt gambar", async ({
    page,
  }) => {
    await awasi(page);
    const judul = new Set<string>();
    for (const h of HALAMAN) {
      await page.goto(h);
      await expect(page.locator("h1"), h).toHaveCount(1);
      await expect(page.locator("main"), h).toHaveCount(1);
      await expect(page.locator("html"), h).toHaveAttribute("lang", "id");
      const r = await page.evaluate(() => {
        const lv = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((e) =>
          Number(e.tagName[1]),
        );
        return {
          lompat: lv.filter((l, i) => (i === 0 ? l !== 1 : l - lv[i - 1]! > 1)),
          tanpaAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
        };
      });
      expect(r.lompat, `${h} heading melompat`).toEqual([]);
      expect(r.tanpaAlt, h).toBe(0);
      judul.add(await page.title());
    }
    expect(judul.size).toBe(HALAMAN.length);
  });

  test("keyboard: Tab pertama = tautan lewati-konten; Enter memindahkan fokus ke konten", async ({
    page,
  }) => {
    await page.goto("/profil");
    await page.keyboard.press("Tab");
    const lewati = page.getByRole("link", { name: "Langsung ke konten utama" });
    await expect(lewati).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#isi$/);
  });
});
