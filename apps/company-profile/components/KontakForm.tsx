"use client";

import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, FormField } from "@tpl/ui";

type Errors = Record<string, string>;
type State =
  | { s: "idle" }
  | { s: "mengirim" }
  | { s: "galat"; pesan: string; errors: Errors }
  | { s: "sukses" };

const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

type Props = { layanan: Array<{ slug: string; nama: string }> };

export function KontakForm({ layanan }: Props) {
  const [state, setState] = useState<State>({ s: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState({ s: "mengirim" });
    try {
      const res = await fetch("/api/kontak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: Errors;
      };
      if (res.ok && data.ok) {
        form.reset();
        setState({ s: "sukses" });
        return;
      }
      setState({
        s: "galat",
        pesan: data.error ?? "Gagal mengirim. Coba lagi.",
        errors: data.errors ?? {},
      });
    } catch {
      setState({ s: "galat", pesan: "Koneksi bermasalah. Coba lagi.", errors: {} });
    }
  }

  const errors = state.s === "galat" ? state.errors : {};

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Form kontak" className="space-y-4">
      <FormField label="Nama" required error={errors.nama}>
        <input name="nama" type="text" autoComplete="name" className={input} />
      </FormField>
      <FormField label="Email" required error={errors.email}>
        <input name="email" type="email" autoComplete="email" className={input} />
      </FormField>
      <FormField
        label="Nomor telepon / WhatsApp (opsional)"
        error={errors.telepon}
        hint="Contoh: 081234567890"
      >
        <input name="telepon" type="tel" autoComplete="tel" inputMode="tel" className={input} />
      </FormField>
      <FormField label="Layanan yang diminati (opsional)" error={errors.layanan}>
        <select name="layanan" defaultValue="" className={input}>
          <option value="">— Pilih layanan —</option>
          {layanan.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.nama}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Pesan" required error={errors.isi} hint="10–2000 karakter">
        <textarea name="isi" rows={5} maxLength={2200} className={input} />
      </FormField>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.s === "galat" && (
        <p role="alert" className="text-sm text-danger">
          {state.pesan}
        </p>
      )}
      {state.s === "sukses" && (
        <p
          role="status"
          data-testid="kontak-sukses"
          className="rounded-md border border-border bg-surface p-3 text-success"
        >
          Terima kasih! Pesan Anda telah kami terima. Kami akan membalas dalam 1 hari kerja.
        </p>
      )}

      <Button type="submit" size="lg" disabled={state.s === "mengirim"}>
        {state.s === "mengirim" ? "Mengirim…" : "Kirim Pesan"}
      </Button>
    </form>
  );
}
