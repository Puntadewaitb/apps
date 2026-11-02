import { describe, expect, it, vi } from "vitest";
import { bersihkanHeader, kirimNotifikasi, smtpConfig } from "./mailer";

const ENV = { SMTP_HOST: "smtp.contoh.id", MAIL_TO: "admin@contoh.id" };
const PESAN = {
  nama: "Budi Santoso",
  email: "budi@contoh.id",
  telepon: "6281234567890",
  layanan: "analitik-data",
  isi: "Halo, saya ingin konsultasi.",
};

describe("smtpConfig", () => {
  it("null bila host/penerima tidak ada atau tidak valid", () => {
    expect(smtpConfig({})).toBeNull();
    expect(smtpConfig({ SMTP_HOST: "smtp.x.id" })).toBeNull();
    expect(smtpConfig({ MAIL_TO: "a@b.id" })).toBeNull();
    expect(smtpConfig({ ...ENV, SMTP_HOST: "evil.com; rm -rf" })).toBeNull();
    expect(smtpConfig({ ...ENV, MAIL_TO: "bukan-email" })).toBeNull();
    expect(smtpConfig({ ...ENV, MAIL_TO: "a@b.id,c@d.id" })).toBeNull();
    expect(smtpConfig({ ...ENV, SMTP_PORT: "99999" })).toBeNull();
    expect(smtpConfig({ ...ENV, SMTP_PORT: "abc" })).toBeNull();
    expect(smtpConfig({ ...ENV, MAIL_FROM: "a@b.id\r\nBcc: x@y.id" })).toBeNull();
  });
  it("valid: default port 587, from otomatis, secure opsional", () => {
    expect(smtpConfig(ENV)).toMatchObject({
      host: "smtp.contoh.id",
      port: 587,
      secure: false,
      to: "admin@contoh.id",
      from: "no-reply@smtp.contoh.id",
    });
    expect(
      smtpConfig({ ...ENV, SMTP_PORT: "465", SMTP_SECURE: "TRUE", SMTP_USER: "u", SMTP_PASS: "p" }),
    ).toMatchObject({
      port: 465,
      secure: true,
      user: "u",
      pass: "p",
    });
  });
});

describe("bersihkanHeader", () => {
  it("menghapus CR/LF & kontrol, merapikan spasi, membatasi panjang", () => {
    expect(bersihkanHeader("Budi\r\nBcc: x@y.id")).toBe("Budi Bcc: x@y.id");
    expect(bersihkanHeader("a\u0000b\tc")).toBe("a b c");
    expect(bersihkanHeader("x".repeat(500), 10)).toHaveLength(10);
  });
});

describe("kirimNotifikasi", () => {
  it("false tanpa konfigurasi (transport tidak dibuat)", async () => {
    const createTransport = vi.fn();
    expect(await kirimNotifikasi(PESAN, {}, { createTransport } as never)).toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("mengirim teks polos dengan replyTo & subjek aman", async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    const createTransport = vi.fn().mockReturnValue({ sendMail });
    const ok = await kirimNotifikasi({ ...PESAN, nama: "Budi\r\nBcc: jahat@x.id" }, ENV, {
      createTransport,
    } as never);
    expect(ok).toBe(true);
    const arg = sendMail.mock.calls[0]![0];
    expect(arg).toMatchObject({
      to: "admin@contoh.id",
      replyTo: "budi@contoh.id",
      from: "no-reply@smtp.contoh.id",
    });
    expect(arg.subject).toBe("[Kontak website] Budi Bcc: jahat@x.id");
    expect(arg.subject).not.toMatch(/[\r\n]/);
    expect(arg.html).toBeUndefined();
    expect(arg.text).toContain("Halo, saya ingin konsultasi.");
    expect(arg.text).toContain("Layanan : analitik-data");
    expect(createTransport.mock.calls[0]![0]).toMatchObject({
      host: "smtp.contoh.id",
      port: 587,
      connectionTimeout: 5000,
    });
  });

  it("false (tanpa melempar) bila pengiriman gagal", async () => {
    const createTransport = vi
      .fn()
      .mockReturnValue({ sendMail: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) });
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await kirimNotifikasi(PESAN, ENV, { createTransport } as never)).toBe(false);
    err.mockRestore();
  });
});
