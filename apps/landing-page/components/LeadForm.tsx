"use client";

import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, FormField } from "@tpl/ui";

type Errors = Record<string, string>;
type State =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; errors: Errors }
  | { status: "success"; whatsappUrl: string };

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

export function LeadForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: Errors;
        whatsappUrl?: string;
      };
      if (res.ok && data.ok && data.whatsappUrl) {
        setState({ status: "success", whatsappUrl: data.whatsappUrl });
        window.location.assign(data.whatsappUrl);
        return;
      }
      setState({
        status: "error",
        message: data.error ?? "Gagal mengirim. Coba lagi.",
        errors: data.errors ?? {},
      });
    } catch {
      setState({ status: "error", message: "Koneksi bermasalah. Coba lagi.", errors: {} });
    }
  }

  const errors = state.status === "error" ? state.errors : {};
  const busy = state.status === "submitting" || state.status === "success";

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-4" aria-label="Form kontak">
      <FormField label="Nama" required error={errors.name}>
        <input name="name" type="text" autoComplete="name" className={inputClass} />
      </FormField>
      <FormField label="Nomor WhatsApp" required error={errors.phone} hint="Contoh: 081234567890">
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputClass} />
      </FormField>
      <FormField label="Pesan (opsional)" error={errors.message}>
        <textarea name="message" rows={4} className={inputClass} />
      </FormField>

      {/* Honeypot: disembunyikan dari pengguna & pembaca layar; bot biasanya mengisinya. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="text-sm text-success">
          Terkirim! Mengarahkan ke WhatsApp…{" "}
          <a href={state.whatsappUrl} className="underline">
            Klik di sini bila tidak berpindah
          </a>
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy}>
        {state.status === "submitting" ? "Mengirim…" : "Kirim & Lanjut ke WhatsApp"}
      </Button>
    </form>
  );
}
