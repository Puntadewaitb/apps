import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  MAX_GAMBAR,
  NAMA_UPLOAD,
  PATH_UPLOAD,
  bacaUpload,
  mimeDariNama,
  simpanGambar,
  uploadDir,
} from "./upload";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1, 2, 3]);
const JPG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 1, 2, 3]);
let dir: string;
const prev = process.env.UPLOAD_DIR;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "upl-"));
  process.env.UPLOAD_DIR = dir;
});
afterAll(() => {
  if (prev === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = prev;
  rmSync(dir, { recursive: true, force: true });
});

describe("simpanGambar", () => {
  it("menyimpan PNG/JPG valid dengan nama acak buatan server (bukan nama klien) dan bisa dibaca lagi", async () => {
    const r = await simpanGambar(new File([PNG], "../../evil.php.png", { type: "image/png" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = PATH_UPLOAD.exec(r.path);
    expect(m).not.toBeNull();
    expect(r.path).not.toContain("evil");
    expect(readdirSync(uploadDir())).toContain(m![1]);
    expect(new Uint8Array(readFileSync(join(uploadDir(), m![1]!)))).toEqual(PNG);
    expect(await bacaUpload(m![1]!)).not.toBeNull();
    const j = await simpanGambar(new File([JPG], "foto.jpg", { type: "image/jpeg" }));
    expect(j.ok && j.path.endsWith(".jpg")).toBe(true);
  });

  it("menolak: kosong, terlalu besar, SVG/HTML/GIF/PDF, MIME klaim berbeda dari isi (penyamaran)", async () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0]);
    const pdf = new TextEncoder().encode("%PDF-1.4 ...");
    const besar = new Uint8Array(MAX_GAMBAR + 1);
    besar.set(PNG);
    const kasus: Array<[string, File]> = [
      ["kosong", new File([], "a.png", { type: "image/png" })],
      ["terlalu besar", new File([besar], "a.png", { type: "image/png" })],
      ["svg", new File([svg], "a.png", { type: "image/png" })],
      ["svg sungguhan", new File([svg], "a.svg", { type: "image/svg+xml" })],
      ["html menyamar png", new File([html], "a.png", { type: "image/png" })],
      ["gif", new File([gif], "a.gif", { type: "image/gif" })],
      ["pdf", new File([pdf], "a.pdf", { type: "application/pdf" })],
      ["png diklaim jpeg", new File([PNG], "a.jpg", { type: "image/jpeg" })],
      ["png diklaim html", new File([PNG], "a.png", { type: "text/html" })],
    ];
    const sebelum = readdirSync(uploadDir()).length;
    for (const [nama, f] of kasus) {
      const r = await simpanGambar(f);
      expect(r.ok, nama).toBe(false);
    }
    expect(readdirSync(uploadDir()).length).toBe(sebelum); // tidak ada file yang tertulis
  });
});

describe("akses file unggahan", () => {
  it("bacaUpload menolak nama di luar pola (traversal, ekstensi lain, terlalu pendek)", async () => {
    for (const n of [
      "../etc/passwd",
      "..%2Fx.png",
      "a.png",
      "abcdefghijklmnop.svg",
      "abcdefghijklmnop.png/../../x",
      "abcdefghijklmnop.PNG",
      "/etc/passwd",
      "abcdefghijklmnop.png\u0000.x",
      "",
    ]) {
      expect(await bacaUpload(n), n).toBeNull();
    }
    expect(await bacaUpload("tidakadatidakadatidakada.png")).toBeNull(); // pola valid tapi file tak ada
  });
  it("pola nama & MIME konsisten", () => {
    expect(NAMA_UPLOAD.test("abcdefghijklmnop.png")).toBe(true);
    expect(mimeDariNama("x.png")).toBe("image/png");
    expect(mimeDariNama("x.jpg")).toBe("image/jpeg");
    expect(mimeDariNama("x.webp")).toBe("image/webp");
    expect(mimeDariNama("x.svg")).toBeUndefined();
  });
});
