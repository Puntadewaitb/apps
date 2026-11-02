import { appendFileSync, rmSync } from "node:fs";
import net from "node:net";

export const MAIL_FILE = "e2e-mail.jsonl";
/** Bila isi email memuat token ini, sink menolak DATA (mensimulasikan SMTP gagal). */
export const TOKEN_GAGAL = "TRIGGER-GAGAL-SMTP";

/** SMTP sink minimal (tanpa TLS/AUTH) untuk uji e2e: menyimpan tiap email ke MAIL_FILE sebagai satu baris JSON. */
export function startSmtpSink(port: number): Promise<net.Server> {
  rmSync(MAIL_FILE, { force: true });
  const server = net.createServer((sock) => {
    let buf = "";
    let inData = false;
    let from = "";
    let to: string[] = [];
    let data = "";
    sock.setEncoding("utf8");
    sock.write("220 sink ESMTP siap\r\n");
    sock.on("error", () => undefined);
    sock.on("data", (chunk: string) => {
      buf += chunk;
      if (inData) {
        const end = buf.indexOf("\r\n.\r\n");
        if (end === -1) return;
        data = buf.slice(0, end);
        buf = buf.slice(end + 5);
        inData = false;
        if (data.includes(TOKEN_GAGAL)) {
          sock.write("554 5.3.0 ditolak oleh sink (simulasi gagal)\r\n");
        } else {
          appendFileSync(MAIL_FILE, JSON.stringify({ from, to, data }) + "\n");
          sock.write("250 2.0.0 diterima\r\n");
        }
        from = "";
        to = [];
      }
      let i: number;
      while (!inData && (i = buf.indexOf("\r\n")) !== -1) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const cmd = line.toUpperCase();
        if (cmd.startsWith("EHLO") || cmd.startsWith("HELO"))
          sock.write("250-sink\r\n250 8BITMIME\r\n");
        else if (cmd.startsWith("MAIL FROM")) {
          from = /<([^>]*)>/.exec(line)?.[1] ?? "";
          sock.write("250 OK\r\n");
        } else if (cmd.startsWith("RCPT TO")) {
          to.push(/<([^>]*)>/.exec(line)?.[1] ?? "");
          sock.write("250 OK\r\n");
        } else if (cmd === "DATA") {
          sock.write("354 kirim data, akhiri dengan <CRLF>.<CRLF>\r\n");
          inData = true;
          // data bisa sudah ada di buffer
          const end = buf.indexOf("\r\n.\r\n");
          if (end !== -1) {
            data = buf.slice(0, end);
            buf = buf.slice(end + 5);
            inData = false;
            if (data.includes(TOKEN_GAGAL))
              sock.write("554 5.3.0 ditolak oleh sink (simulasi gagal)\r\n");
            else {
              appendFileSync(MAIL_FILE, JSON.stringify({ from, to, data }) + "\n");
              sock.write("250 2.0.0 diterima\r\n");
            }
          }
        } else if (cmd === "RSET" || cmd === "NOOP") sock.write("250 OK\r\n");
        else if (cmd === "QUIT") {
          sock.write("221 bye\r\n");
          sock.end();
        } else sock.write("502 perintah tidak dikenal\r\n");
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
