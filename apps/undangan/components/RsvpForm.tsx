"use client";

import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, FormField, Section } from "@tpl/ui";

type Errors = Record<string, string>;
type State =
  | { s: "idle" }
  | { s: "submitting" }
  | { s: "error"; message: string; errors: Errors }
  | { s: "success"; status: string; pax: number; updated: boolean };

const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

const OPSI = [
  { value: "HADIR", label: "Hadir" },
  { value: "TIDAK_HADIR", label: "Tidak hadir" },
  { value: "RAGU", label: "Masih ragu" },
] as const;

type Props = { defaultName?: string; kode?: string; maxPax: number };

export function RsvpForm({ defaultName = "", kode, maxPax }: Props) {
  const [state, setState] = useState<State>({ s: "idle" });
  const [status, setStatus] = useState<string>("HADIR");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ s: "submitting" });
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd), ...(kode ? { kode } : {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        errors?: Errors;
        status?: string;
        pax?: number;
        updated?: boolean;
      };
      if (res.ok && data.ok) {
        setState({
          s: "success",
          status: data.status ?? status,
          pax: data.pax ?? 0,
          updated: !!data.updated,
        });
        return;
      }
      setState({
        s: "error",
        message: data.error ?? "Gagal mengirim. Coba lagi.",
        errors: data.errors ?? {},
      });
    } catch {
      setState({ s: "error", message: "Koneksi bermasalah. Coba lagi.", errors: {} });
    }
  }

  if (state.s === "success") {
    const teks =
      state.status === "HADIR"
        ? `Terima kasih! Kehadiran Anda (${state.pax} orang) telah tercatat.`
        : state.status === "TIDAK_HADIR"
          ? "Terima kasih atas konfirmasinya. Doa terbaik untuk kedua mempelai."
          : "Terima kasih. Kabari kami kembali bila Anda sudah dapat memastikan.";
    return (
      <div
        role="status"
        data-testid="rsvp-sukses"
        className="rounded-lg border border-border bg-bg p-5"
      >
        <p className="font-medium text-success">{teks}</p>
        {state.updated && (
          <p className="mt-1 text-sm text-muted">Konfirmasi sebelumnya telah diperbarui.</p>
        )}
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setState({ s: "idle" })}>
          Ubah konfirmasi
        </Button>
      </div>
    );
  }

  const errors = state.s === "error" ? state.errors : {};
  const busy = state.s === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Form RSVP" className="max-w-xl space-y-4">
      <FormField label="Nama" required error={errors.name}>
        <input
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={defaultName}
          className={input}
        />
      </FormField>

      <fieldset aria-describedby={errors.status ? "rsvp-status-error" : undefined}>
        <legend className="mb-1.5 text-sm font-medium text-fg">
          Konfirmasi kehadiran{" "}
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {OPSI.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-fg">
              <input
                type="radio"
                name="status"
                value={o.value}
                checked={status === o.value}
                onChange={() => setStatus(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
        {errors.status && (
          <p id="rsvp-status-error" role="alert" className="mt-1 text-sm text-danger">
            {errors.status}
          </p>
        )}
      </fieldset>

      {status === "HADIR" && (
        <FormField
          label="Jumlah orang yang hadir"
          error={errors.pax}
          hint={`Maksimal ${maxPax} orang`}
        >
          <select name="pax" defaultValue="1" className={input}>
            {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} orang
              </option>
            ))}
          </select>
        </FormField>
      )}

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.s === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
          {errors.kode ? ` (${errors.kode})` : ""}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Mengirim…" : "Kirim Konfirmasi"}
      </Button>
    </form>
  );
}

/** Pembungkus section RSVP (server-friendly). */
export function RsvpSection(props: Props) {
  return (
    <Section
      id="rsvp"
      title="Konfirmasi Kehadiran"
      subtitle="Mohon konfirmasi kehadiran Anda agar kami dapat mempersiapkan sebaik-baiknya."
    >
      <RsvpForm {...props} />
    </Section>
  );
}
