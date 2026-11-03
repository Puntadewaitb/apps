"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button, FormField } from "@tpl/ui";
import { amanCallback } from "../../lib/auth-core";

const PESAN: Record<string, string> = {
  KREDENSIAL: "Email atau password salah.",
  RATE_LIMIT: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
  NONAKTIF: "Login admin dinonaktifkan: NEXTAUTH_SECRET belum diatur.",
};
const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

export function LoginForm({ callbackUrl, nonaktif }: { callbackUrl?: string; nonaktif: boolean }) {
  const [galat, setGalat] = useState<string | null>(nonaktif ? PESAN.NONAKTIF! : null);
  const [mengirim, setMengirim] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMengirim(true);
    setGalat(null);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      if (res?.ok && !res.error) {
        // Navigasi penuh agar server membaca cookie sesi baru; tujuan divalidasi (anti open redirect).
        window.location.assign(amanCallback(callbackUrl));
        return;
      }
      setGalat(PESAN[res?.error ?? ""] ?? PESAN.KREDENSIAL!);
    } catch {
      setGalat("Koneksi bermasalah. Coba lagi.");
    } finally {
      setMengirim(false);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label="Form login admin" className="space-y-4">
      <FormField label="Email" required>
        <input name="email" type="email" autoComplete="username" required className={input} />
      </FormField>
      <FormField label="Password" required>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </FormField>
      {galat && (
        <p role="alert" data-testid="galat-login" className="text-sm text-danger">
          {galat}
        </p>
      )}
      <Button type="submit" disabled={mengirim || nonaktif}>
        {mengirim ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
