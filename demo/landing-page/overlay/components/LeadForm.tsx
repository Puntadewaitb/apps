"use client";

// OVERLAY sample statis: menggantikan components/LeadForm.tsx versi asli (yang memanggil /api/leads).
// Validasi memakai skema yang sama dengan server; data TIDAK dikirim/disimpan di mana pun.
import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { buildWhatsAppUrl, Button, FormField } from "@tpl/ui";
import { site } from "../content/site";
import { fieldErrors, leadSchema } from "../lib/lead-schema";

type Errors = Record<string, string>;
type State =
  | { status: "idle" }
  | { status: "error"; message: string; errors: Errors }
  | { status: "success"; whatsappUrl: string };

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

export function LeadForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data[HONEYPOT_FIELD]) return;
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
      setState({
        status: "error",
        message: "Periksa kembali isian Anda.",
        errors: fieldErrors(parsed.error),
      });
      return;
    }
    const { name, phone, message } = parsed.data;
    const text = `Halo ${site.brand}, saya ${name}.${message ? `\n${message}` : ""}\nNo. HP saya: ${phone}`;
    setState({ status: "success", whatsappUrl: buildWhatsAppUrl(site.whatsapp.phone, text) });
  }

  const errors = state.status === "error" ? state.errors : {};

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
        <div role="status" className="rounded-md border border-border bg-surface p-3 text-sm">
          <p className="font-semibold text-success">Contoh berhasil.</p>
          <p className="mt-1 text-fg">
            Ini versi demo, jadi data Anda tidak dikirim atau disimpan. Di versi lengkap, pesan
            tersimpan di dasbor admin dan Anda diarahkan ke WhatsApp.
          </p>
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block underline"
          >
            Lihat pesan WhatsApp yang akan terkirim
          </a>
        </div>
      )}

      <Button type="submit" size="lg">
        Kirim & Lanjut ke WhatsApp
      </Button>
    </form>
  );
}
