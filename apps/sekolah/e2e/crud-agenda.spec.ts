import { expect, test } from "@playwright/test";
import { awasi, huruf, login, query } from "./helpers";

test.describe("CRUD agenda", () => {
  test("tambah → tampil di kalender & daftar publik pada tanggal WIB yang benar → ubah → hapus", async ({
    page,
  }) => {
    const p = await awasi(page);
    const judul = `Uji Agenda ${huruf()}`;
    await login(page);
    await page.goto("/admin/agenda");
    await page.getByRole("link", { name: "+ Kegiatan baru" }).click();
    await page.getByLabel("Nama kegiatan").fill(judul);
    await page.getByLabel("Mulai (WIB)").fill("2033-07-15T23:30");
    await page.getByLabel("Selesai (WIB)").fill("2033-07-16T01:00");
    await page.getByLabel("Lokasi").fill("Aula Uji");
    await page.getByLabel("Deskripsi").fill("Deskripsi uji agenda.");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/agenda\?ok=tersimpan$/);
    const row = query<{ id: number; startsAt: string; endsAt: string }>(
      "SELECT id, startsAt, endsAt FROM Agenda WHERE title = ?",
      judul,
    )[0]!;
    // disimpan sebagai UTC: 23:30 WIB = 16:30Z
    expect(new Date(row.startsAt).toISOString()).toBe("2033-07-15T16:30:00.000Z");
    expect(new Date(row.endsAt).toISOString()).toBe("2033-07-15T18:00:00.000Z");

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/agenda?bulan=2033-07");
    await expect(page.getByTestId("item-agenda").filter({ hasText: judul })).toContainText(
      "Aula Uji",
    );
    // mulai 15 Juli malam & selesai 16 Juli dini hari (WIB) → muncul di kedua hari
    await expect(
      page.locator('td[data-tanggal="2033-07-15"]').getByRole("link", { name: judul }),
    ).toBeVisible();
    await expect(
      page.locator('td[data-tanggal="2033-07-16"]').getByRole("link", { name: judul }),
    ).toBeVisible();

    // ubah
    await page.goto(`/admin/agenda/${row.id}`);
    await expect(page.getByLabel("Mulai (WIB)")).toHaveValue("2033-07-15T23:30"); // round-trip WIB
    await page.getByLabel("Lokasi").fill("Lapangan Uji");
    await page.getByLabel("Selesai (WIB)").fill("");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByTestId("baris-agenda").filter({ hasText: judul })).toContainText(
      "Lapangan Uji",
    );
    expect(
      query<{ endsAt: string | null }>("SELECT endsAt FROM Agenda WHERE id = ?", row.id)[0]!.endsAt,
    ).toBeNull();

    // hapus
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-agenda")
      .filter({ hasText: judul })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(query("SELECT id FROM Agenda WHERE id = ?", row.id)).toHaveLength(0);
    await page.goto("/agenda?bulan=2033-07");
    await expect(page.locator("body")).not.toContainText(judul);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("validasi: selesai sebelum mulai, waktu kosong/salah, judul pendek → ditolak", async ({
    page,
  }) => {
    await login(page);
    const hitung = () =>
      query<{ c: number }>(
        "SELECT count(*) c FROM Agenda WHERE title IN ('ab', 'Kegiatan Valid Uji')",
      )[0]!.c;
    await page.goto("/admin/agenda/baru");
    await page.getByLabel("Nama kegiatan").fill("ab");
    await page.getByLabel("Mulai (WIB)").fill("2033-07-15T10:00");
    await page.getByRole("button", { name: "Simpan" }).click();
    const form = page.getByRole("form", { name: "Form agenda" });
    await expect(form).toContainText("Judul minimal 3 karakter.");
    // validasi browser (atribut required) bisa dilewati penyerang → server tetap menolak waktu kosong
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await page.getByLabel("Mulai (WIB)").fill("");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toContainText("Waktu mulai tidak valid.");

    await page.getByLabel("Nama kegiatan").fill("Kegiatan Valid Uji");
    await page.getByLabel("Mulai (WIB)").fill("2033-07-15T10:00");
    await page.getByLabel("Selesai (WIB)").fill("2033-07-15T09:00");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toContainText("Waktu selesai tidak boleh sebelum waktu mulai.");
    expect(hitung()).toBe(0);
  });

  test("HTML di judul/lokasi dibersihkan saat simpan; ID tak valid → 404", async ({ page }) => {
    const t = huruf();
    await login(page);
    await page.goto("/admin/agenda/baru");
    await page.getByLabel("Nama kegiatan").fill(`Uji Xss <img src=x onerror=alert(1)> ${t}`);
    await page.getByLabel("Mulai (WIB)").fill("2033-08-01T08:00");
    await page.getByLabel("Lokasi").fill("<script>alert(1)</script>Aula");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/ok=tersimpan/);
    const row = query<{ id: number; title: string; location: string }>(
      "SELECT id, title, location FROM Agenda WHERE title LIKE ?",
      `%${t}%`,
    )[0]!;
    expect(row.title).not.toMatch(/[<>]/);
    expect(row.location).not.toMatch(/[<>]/);
    for (const id of ["99999", "abc", "-1"])
      expect((await page.goto(`/admin/agenda/${id}`))?.status(), id).toBe(404);
    page.once("dialog", (d) => void d.accept());
    await page.goto("/admin/agenda");
    await page
      .getByTestId("baris-agenda")
      .filter({ hasText: t })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toBeVisible();
  });
});
