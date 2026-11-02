import { describe, expect, it } from "vitest";
import {
  agendaSchema,
  albumSchema,
  beritaSchema,
  dariForm,
  galatZod,
  guruSchema,
  keteranganSchema,
  PATH_GAMBAR,
} from "./validasi";

const berita = {
  title: "Judul Berita Valid",
  kind: "BERITA",
  excerpt: "Ringkasan yang cukup panjang untuk lolos validasi.",
  body: "Isi berita yang cukup panjang untuk lolos validasi minimal.",
  publishedAt: "",
};

describe("beritaSchema", () => {
  it("menerima data valid; centang & tanggal opsional", () => {
    const r = beritaSchema.parse({ ...berita, published: "on", publishedAt: "2027-02-13T09:00" });
    expect(r.published).toBe(true);
    expect(r.publishedAt?.toISOString()).toBe("2027-02-13T02:00:00.000Z");
    expect(beritaSchema.parse(berita).published).toBe(false);
    expect(beritaSchema.parse(berita).publishedAt).toBeNull();
  });
  it("menolak jenis tak dikenal, judul/ringkasan/isi terlalu pendek atau panjang, tanggal salah", () => {
    for (const bad of [
      { kind: "LAIN" },
      { kind: "berita" },
      { title: "abc" },
      { title: "x".repeat(151) },
      { excerpt: "pendek" },
      { body: "pendek" },
      { body: "x".repeat(20_001) },
      { publishedAt: "kemarin" },
    ])
      expect(beritaSchema.safeParse({ ...berita, ...bad }).success, JSON.stringify(bad)).toBe(
        false,
      );
  });
  it("judul: tag HTML dibuang; isi (Markdown): karakter kontrol dibuang tetapi teks dipertahankan apa adanya", () => {
    const r = beritaSchema.parse({
      ...berita,
      title: "Judul <b>tebal</b> <script>x</script> valid",
      body: `Isi **tebal**\u0000\r\n<b>mentah</b> tetap teks. ${"x".repeat(30)}`,
    });
    expect(r.title).not.toMatch(/[<>]/);
    expect(r.body).toContain("<b>mentah</b>");
    expect(r.body).not.toContain("\u0000");
    expect(r.body).not.toContain("\r");
  });
});

describe("agendaSchema", () => {
  const a = {
    title: "Rapat Guru",
    description: "",
    location: "",
    startsAt: "2027-02-13T09:00",
    endsAt: "",
  };
  it("valid; akhir kosong → null", () => {
    expect(agendaSchema.parse(a).endsAt).toBeNull();
  });
  it("selesai tidak boleh sebelum mulai; format waktu salah ditolak", () => {
    const r = agendaSchema.safeParse({ ...a, endsAt: "2027-02-13T08:00" });
    expect(r.success).toBe(false);
    if (!r.success) expect(galatZod(r.error).errors).toHaveProperty("endsAt");
    expect(agendaSchema.safeParse({ ...a, endsAt: "2027-02-13T09:00" }).success).toBe(true); // sama = boleh
    expect(agendaSchema.safeParse({ ...a, startsAt: "" }).success).toBe(false);
    expect(agendaSchema.safeParse({ ...a, startsAt: "13/02/2027" }).success).toBe(false);
  });
});

describe("guruSchema", () => {
  const g = { name: "Budi Hartono", position: "Guru", subject: "", bio: "", sort: "3" };
  it("sort → angka; ditolak bila bukan bilangan bulat 0–9999", () => {
    expect(guruSchema.parse(g).sort).toBe(3);
    for (const sort of ["", "-1", "1.5", "abc", "10000", "1e2", " 3"])
      expect(guruSchema.safeParse({ ...g, sort }).success, sort).toBe(false);
  });
});

describe("albumSchema & keterangan", () => {
  it("judul min 3; keterangan maks 150", () => {
    expect(albumSchema.safeParse({ title: "ab", description: "" }).success).toBe(false);
    expect(albumSchema.safeParse({ title: "Album", description: "" }).success).toBe(true);
    expect(keteranganSchema.safeParse("x".repeat(151)).success).toBe(false);
    expect(keteranganSchema.parse("Foto <i>bagus</i>")).not.toMatch(/[<>]/);
  });
});

describe("PATH_GAMBAR", () => {
  it("hanya /img/… atau /uploads/<nama-acak>.png|jpg|webp", () => {
    for (const ok of [
      "/img/guru-1.svg",
      "/img/a.b-c_d.png",
      "/uploads/abcdefghijklmnop.jpg",
      "/uploads/AbC-123_xyzABC12345.webp",
    ])
      expect(PATH_GAMBAR.test(ok), ok).toBe(true);
    for (const bad of [
      "",
      "https://evil.example/x.png",
      "//evil.example/x.png",
      "/img/../../etc/passwd.png",
      "/uploads/pendek.jpg",
      "/uploads/abcdefghijklmnop.svg",
      "/uploads/abcdefghijklmnop.gif",
      "/uploads/../x.png",
      "javascript:alert(1)",
      "/img/x.png?x=1",
      "/other/x.png",
      "/uploads/abcdefghijklmnop.jpg\n",
    ])
      expect(PATH_GAMBAR.test(bad), bad).toBe(false);
  });
});

describe("dariForm", () => {
  it("hanya string; File dan field internal Next dibuang", () => {
    const fd = new FormData();
    fd.set("a", "1");
    fd.set("f", new File(["x"], "x.txt"));
    fd.set("$ACTION_ID_abc", "z");
    expect(dariForm(fd)).toEqual({ a: "1" });
  });
});
