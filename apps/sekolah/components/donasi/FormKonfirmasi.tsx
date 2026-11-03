"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, FormField } from "@tpl/ui";
import type { HasilKonfirmasi } from "../../app/(publik)/donasi/actions";

const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

/** Formulir konfirmasi transfer. Dikirim lewat onSubmit (bukan atribut action saja) agar isian & berkas tak hilang bila ditolak. */
export function FormKonfirmasi({
  action,
  slug,
  minimal,
}: {
  action: (prev: HasilKonfirmasi, fd: FormData) => Promise<HasilKonfirmasi>;
  slug: string;
  minimal: number;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as HasilKonfirmasi);
  const e = s.errors ?? {};
  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => kirim(fd));
  }
  if (s.ok)
    return (
      <div
        role="status"
        data-testid="donasi-sukses"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h3 className="text-lg font-bold text-fg">Terima kasih!</h3>
        <p className="mt-1 text-fg">
          Konfirmasi donasi Anda sudah kami terima dan akan diverifikasi oleh pengurus. Setelah
          terverifikasi, donasi Anda akan ikut dihitung pada progres program.
        </p>
      </div>
    );
  return (
    <form
      action={kirim}
      onSubmit={onSubmit}
      aria-label="Form konfirmasi donasi"
      encType="multipart/form-data"
      className="space-y-4"
    >
      <input type="hidden" name="program" value={slug} />
      <FormField label="Nama donatur" required error={e.donorName}>
        <input name="donorName" autoComplete="name" maxLength={100} className={input} />
      </FormField>
      <FormField
        label="Nominal transfer (Rp)"
        required
        error={e.amount}
        hint={`Minimal Rp ${minimal.toLocaleString("id-ID")}. Contoh: 150000 atau 150.000`}
      >
        <input name="amount" inputMode="numeric" autoComplete="off" className={input} />
      </FormField>
      <FormField
        label="Bukti transfer"
        required
        error={e.bukti}
        hint="Foto/tangkapan layar (PNG, JPG, WebP) atau PDF; maksimal 2 MB. Hanya dapat dilihat pengurus."
      >
        <input
          name="bukti"
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className={input}
        />
      </FormField>
      <FormField label="Pesan / doa (opsional)" error={e.message}>
        <textarea name="message" rows={3} maxLength={320} className={input} />
      </FormField>
      <label className="flex items-center gap-2 text-fg">
        <input type="checkbox" name="anonymous" /> Sembunyikan nama saya (tampil sebagai
        &ldquo;Hamba Allah&rdquo;)
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {s.ok === false && s.pesan && (
        <p role="alert" data-testid="galat-donasi" className="text-sm text-danger">
          {s.pesan}
        </p>
      )}
      <Button type="submit" size="lg" disabled={menunggu}>
        {menunggu ? "Mengirim…" : "Kirim Konfirmasi"}
      </Button>
    </form>
  );
}
