import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  MAX_DOKUMEN,
  NAMA_DOKUMEN,
  bacaDokumen,
  dokumenDir,
  hapusDokumen,
  mimeDokumen,
  parseDokumen,
  periksaDokumen,
  simpanDokumen,
} from "./dokumen";
import { bacaUpload } from "./upload";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1]);
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n");
let dir: string;
const prev = process.env.UPLOAD_DIR;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "dok-"));
  process.env.UPLOAD_DIR = dir;
});
afterAll(() => {
  if (prev === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = prev;
  rmSync(dir, { recursive: true, force: true });
});

describe("periksaDokumen", () => {
  it("menerima PDF/PNG valid (tipe dari isi, bukan nama)", async () => {
    const a = await periksaDokumen(new File([PDF], "../../x.exe", { type: "application/pdf" }));
    expect(a.ok && a.dok.ext).toBe("pdf");
    const b = await periksaDokumen(new File([PNG], "a.png", { type: "image/png" }));
    expect(b.ok && b.dok.ext).toBe("png");
  });

  it("menolak: kosong, terlalu besar, SVG/HTML/GIF/EXE, MIME tidak cocok isi", async () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const exe = Uint8Array.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]);
    const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0]);
    const besar = new Uint8Array(MAX_DOKUMEN + 1);
    besar.set(PDF);
    const kasus: Array<[string, File]> = [
      ["kosong", new File([], "a.pdf", { type: "application/pdf" })],
      ["besar", new File([besar], "a.pdf", { type: "application/pdf" })],
      ["svg", new File([svg], "a.svg", { type: "image/svg+xml" })],
      ["svg menyamar", new File([svg], "a.pdf", { type: "application/pdf" })],
      ["html menyamar", new File([html], "a.png", { type: "image/png" })],
      ["exe", new File([exe], "a.pdf", { type: "application/pdf" })],
      ["gif", new File([gif], "a.gif", { type: "image/gif" })],
      ["pdf diklaim png", new File([PDF], "a.png", { type: "image/png" })],
      ["png diklaim pdf", new File([PNG], "a.pdf", { type: "application/pdf" })],
    ];
    for (const [n, f] of kasus) expect((await periksaDokumen(f)).ok, n).toBe(false);
  });
});

describe("penyimpanan privat", () => {
  it("disimpan di subfolder dokumen/; TIDAK terbaca lewat jalur unggahan publik; bisa dihapus", async () => {
    const r = await periksaDokumen(new File([PDF], "a.pdf", { type: "application/pdf" }));
    if (!r.ok) throw new Error("harus valid");
    const nama = await simpanDokumen(r.dok);
    expect(nama).toMatch(NAMA_DOKUMEN);
    expect(readdirSync(dokumenDir())).toContain(nama);
    expect(await bacaDokumen(nama)).not.toBeNull();
    expect(readdirSync(dir).filter((f) => f === nama)).toHaveLength(0); // bukan di folder unggahan publik
    expect(await bacaUpload(nama)).toBeNull(); // jalur /uploads tak bisa membacanya
    await hapusDokumen(nama);
    expect(await bacaDokumen(nama)).toBeNull();
  });

  it("nama di luar pola (traversal dsb.) tidak dibaca/dihapus", async () => {
    for (const n of [
      "../x.pdf",
      "..%2Fx.pdf",
      "a.pdf",
      "abcdefghijklmnop.exe",
      "abcdefghijklmnop.pdf/../../x",
      "",
      "abcdefghijklmnop.PDF",
    ]) {
      expect(await bacaDokumen(n), n).toBeNull();
    }
    expect(mimeDokumen("x.pdf")).toBe("application/pdf");
    expect(mimeDokumen("x.exe")).toBeUndefined();
  });
});

describe("parseDokumen", () => {
  it("membuang entri berbentuk salah / nama berkas berbahaya; JSON rusak → []", () => {
    const ok = { kind: "akta", file: "abcdefghijklmnop.pdf", mime: "application/pdf", size: 10 };
    expect(parseDokumen(JSON.stringify([ok]))).toEqual([ok]);
    expect(
      parseDokumen(
        JSON.stringify([
          ok,
          { ...ok, file: "../../etc/passwd" },
          { kind: 1 },
          null,
          "x",
          { ...ok, size: "10" },
        ]),
      ),
    ).toEqual([ok]);
    for (const j of ["", "bukan json", "{}", "null", "123", '"x"'])
      expect(parseDokumen(j), j).toEqual([]);
  });
});
