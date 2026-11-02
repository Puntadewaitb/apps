import { startSmtpSink } from "./smtp-sink";

/** Menjalankan SMTP sink lokal selama seluruh run e2e (port 2525). */
export default async function globalSetup() {
  const server = await startSmtpSink(2525);
  return async () => {
    await new Promise<void>((r) => server.close(() => r()));
  };
}
