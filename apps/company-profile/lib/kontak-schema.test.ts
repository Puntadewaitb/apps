import { describe, expect, it } from "vitest";
import { kontakSchema, fieldErrors } from "./kontak-schema";

const OK = {
  nama: "Budi Santoso",
  email: "Budi@Contoh.ID",
  isi: "Saya ingin konsultasi proses bisnis.",
};

describe("kontakSchema", () => {
  it("valid: normalisasi email, telepon & layanan opsional", () => {
    const r = kontakSchema.parse({ ...OK, telepon: "0812-3456-7890", layanan: "analitik-data" });
    expect(r).toMatchObject({
      nama: "Budi Santoso",
      email: "budi@contoh.id",
      telepon: "6281234567890",
      layanan: "analitik-data",
    });
    const min = kontakSchema.parse(OK);
    expect(min.telepon).toBe("");
    expect(min.layanan).toBe("");
  });
  it("menolak & memberi pesan per field", () => {
    const r = kontakSchema.safeParse({
      nama: "B",
      email: "x",
      telepon: "123",
      layanan: "tidak-ada",
      isi: "pendek",
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(Object.keys(fieldErrors(r.error)).sort()).toEqual([
        "email",
        "isi",
        "layanan",
        "nama",
        "telepon",
      ]);
  });
  it("fieldErrors: pesan Indonesia asli skema vs. terjemahan English per field", () => {
    const r = kontakSchema.safeParse({
      nama: "B",
      email: "x",
      telepon: "123",
      layanan: "tidak-ada",
      isi: "pendek",
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const id = fieldErrors(r.error);
    const en = fieldErrors(r.error, "en");
    expect(id.nama).toBe("Nama minimal 2 karakter");
    expect(en).toEqual({
      nama: "Name must be at least 2 characters",
      email: "Invalid email",
      telepon: "Invalid phone number (example: 081234567890)",
      layanan: "Unknown service",
      isi: "Message must be at least 10 characters",
    });
    // Tidak ada sisa kata Indonesia pada pesan EN
    for (const v of Object.values(en)) expect(v).not.toMatch(/minimal|tidak|Nomor|Pesan /);
  });
  it("fieldErrors EN: batas maksimal", () => {
    const r = kontakSchema.safeParse({ ...OK, isi: "a".repeat(2001), nama: "A".repeat(101) });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(fieldErrors(r.error, "en")).toEqual({
      nama: "Name must be at most 100 characters",
      isi: "Message must be at most 2000 characters",
    });
  });
  it("isi disanitasi (tag dibuang)", () => {
    expect(kontakSchema.parse({ ...OK, isi: "Halo <b>tim</b> kami butuh bantuan." }).isi).toBe(
      "Halo tim kami butuh bantuan.",
    );
  });
});
