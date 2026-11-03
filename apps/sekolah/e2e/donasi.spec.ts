import { expect, test } from "@playwright/test";
import { donasi } from "../content/donasi";
import { donations, programs } from "../prisma/seed-data";
import { awasi, berkasPng, berkasSvg, huruf, uniqueIp } from "./helpers";

/** Ekspektasi progres dari data seed (dihitung mandiri, bukan dari kode aplikasi). */
const hitung = (slug: string) => {
  const p = programs.find((x) => x.slug === slug)!;
  const v = donations.filter((d) => d.program === slug && d.status === "TERVERIFIKASI");
  const total = v.reduce((a, d) => a + d.amount, 0);
  return {
    total,
    donatur: v.length,
    persen: Math.floor((total / p.target) * 100),
    target: p.target,
  };
};
const spasi = (s: string | null) => (s ?? "").replace(/\s+/g, " ");
const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

test.describe("halaman donasi", () => {
  test("rekening resmi & kartu program dengan progres dari donasi TERVERIFIKASI saja", async ({
    page,
  }) => {
    const p = await awasi(page);
    await page.goto("/donasi");
    await expect(page).toHaveTitle(`${donasi.judul} | Sekolah Cendekia Nusantara`);
    await expect(page.getByTestId("daftar-rekening").locator("li")).toHaveCount(
      donasi.rekening.length,
    );
    for (const r of donasi.rekening)
      await expect(page.getByTestId("daftar-rekening")).toContainText(r.nomor);
    await expect(page.getByTestId("kartu-program-donasi")).toHaveCount(programs.length);
    for (const prog of programs) {
      const k = page.getByTestId("kartu-program-donasi").filter({ hasText: prog.title });
      const h = hitung(prog.slug);
      expect(spasi(await k.getByTestId("terkumpul").textContent())).toBe(rp(h.total));
      await expect(k.getByTestId("persen")).toHaveText(`${h.persen}%`);
      await expect(k).toContainText(`${h.donatur} donatur`);
      await expect(k).toContainText(
        `dari Rp ${prog.target.toLocaleString("id-ID")}`.replace(/\s/g, " "),
      );
      const bar = k.getByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-valuenow", String(Math.min(100, h.persen)));
      await expect(bar).toHaveAttribute("aria-label", `Terkumpul ${h.persen}% dari target`);
      expect(await bar.locator("div").evaluate((el: HTMLElement) => el.style.width)).toBe(
        `${Math.min(100, h.persen)}%`,
      );
    }
    // donasi MENUNGGU/DITOLAK tidak ikut: beasiswa punya 1 menunggu (Rp 1.000.000) yang tidak dihitung
    expect(hitung("beasiswa-siswa-berprestasi").total).toBe(17_500_000);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("detail program: donatur terverifikasi saja; anonim → 'Hamba Allah' dan nama asli TIDAK ada di HTML", async ({
    page,
    request,
  }) => {
    await page.goto("/donasi/beasiswa-siswa-berprestasi");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Beasiswa Siswa Berprestasi");
    const item = page.getByTestId("item-donatur");
    await expect(item).toHaveCount(3);
    await expect(page.getByTestId("daftar-donatur")).toContainText("Hamba Allah");
    await expect(page.getByTestId("daftar-donatur")).toContainText("Keluarga Bapak Hendra");
    await expect(page.getByTestId("daftar-donatur")).toContainText("Alumni Angkatan 2010");
    await expect(page.getByTestId("daftar-donatur")).not.toContainText("Calon Donatur"); // MENUNGGU
    const html = await (await request.get("/donasi/beasiswa-siswa-berprestasi")).text();
    expect(html).not.toContain("Rahmat Hidayat"); // donatur anonim
    expect(html).not.toContain("Calon Donatur");
    // program musala: donasi DITOLAK tidak tampil
    await page.goto("/donasi/renovasi-musala");
    await expect(page.getByTestId("daftar-donatur")).not.toContainText("Donatur Ditolak");
    await expect(page.getByTestId("item-donatur")).toHaveCount(1);
    // nominal individual donatur tidak diumbar
    await expect(page.getByTestId("daftar-donatur")).not.toContainText("1.500.000");
  });

  test("slug tidak dikenal / berbahaya → 404", async ({ page }) => {
    for (const s of [
      "tidak-ada",
      "__proto__",
      "..%2Fetc",
      "BEASISWA-SISWA-BERPRESTASI",
      "x'%20OR%201=1",
    ]) {
      expect((await page.goto(`/donasi/${s}`))?.status(), s).toBe(404);
    }
  });

  test("validasi server (tanpa menyimpan): nominal salah, bukti kosong/berbahaya, nama berbahaya", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/donasi/buku-perpustakaan");
    const form = page.getByRole("form", { name: "Form konfirmasi donasi" });
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true)); // lewati validasi browser: server tetap harus menolak
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(form).toContainText("Nama minimal 2 karakter");
    await expect(form).toContainText("Nominal wajib diisi.");
    await expect(form).toContainText("Bukti transfer wajib diunggah.");

    await form.getByLabel("Nama donatur").fill("<script>alert(1)</script>");
    await form.getByLabel(/Nominal transfer/).fill("1,5 juta");
    await form.getByLabel("Bukti transfer").setInputFiles(berkasSvg("bukti.png"));
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(form).toContainText("Nama hanya boleh berisi huruf");
    await expect(form).toContainText("Nominal hanya berisi angka bulat rupiah");
    await expect(form).toContainText("Format berkas harus PDF, PNG, JPG, atau WebP.");
    await expect(page.getByTestId("donasi-sukses")).toHaveCount(0);

    await form.getByLabel("Nama donatur").fill(`Donatur ${huruf()}`);
    await form.getByLabel(/Nominal transfer/).fill("5000"); // di bawah minimum
    await form.getByLabel("Bukti transfer").setInputFiles(berkasPng());
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(form).toContainText("Nominal minimal Rp 10.000.");
    // isian tidak hilang
    await expect(form.getByLabel(/Nominal transfer/)).toHaveValue("5000");
  });
});
