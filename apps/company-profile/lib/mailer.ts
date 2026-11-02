import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  to: string;
  from: string;
};

/** Konfigurasi SMTP dari env; null bila tidak lengkap/tidak valid → email dinonaktifkan (pesan tetap tersimpan di DB). */
export function smtpConfig(
  env: Record<string, string | undefined> = process.env,
): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  const to = env.MAIL_TO?.trim();
  if (!host || !to) return null;
  if (!/^[A-Za-z0-9.-]+$/.test(host)) return null;
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) return null;
  const port = Number(env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const from = env.MAIL_FROM?.trim() || `no-reply@${host}`;
  if (/[\r\n]/.test(from)) return null;
  return {
    host,
    port,
    secure: env.SMTP_SECURE?.toLowerCase() === "true",
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASS || undefined,
    to,
    from,
  };
}

/** Buang CR/LF & karakter kontrol agar tidak bisa menyisipkan header email. */
export function bersihkanHeader(s: string, max = 120): string {
  return s
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export type PesanEmail = {
  nama: string;
  email: string;
  telepon: string;
  layanan: string;
  isi: string;
};

export type MailDeps = {
  createTransport: typeof nodemailer.createTransport;
};

/** Kirim notifikasi (teks polos). Tidak pernah melempar: mengembalikan true bila terkirim, false bila gagal/nonaktif. */
export async function kirimNotifikasi(
  p: PesanEmail,
  env: Record<string, string | undefined> = process.env,
  deps: MailDeps = { createTransport: nodemailer.createTransport },
): Promise<boolean> {
  const cfg = smtpConfig(env);
  if (!cfg) return false;
  try {
    const transport = deps.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass ?? "" } : undefined,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 8_000,
    });
    await transport.sendMail({
      from: cfg.from,
      to: cfg.to,
      replyTo: p.email,
      subject: `[Kontak website] ${bersihkanHeader(p.nama, 80)}`,
      text: [
        `Nama    : ${p.nama}`,
        `Email   : ${p.email}`,
        `Telepon : ${p.telepon || "-"}`,
        `Layanan : ${p.layanan || "-"}`,
        "",
        p.isi,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[kontak] gagal mengirim email:", err instanceof Error ? err.message : err);
    return false;
  }
}
