"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export function FormKategori({
  action,
  nilai,
  batal,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: { id?: number; name: string; sort: number };
  batal?: string;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v } = pembacaForm(s);
  return (
    <form
      action={kirim}
      aria-label={nilai.id ? "Form ubah kategori" : "Form kategori baru"}
      className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
    >
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Nama kategori" required error={e.name}>
        <input name="name" defaultValue={v("name", nilai.name)} maxLength={60} className={input} />
      </FormField>
      <FormField label="Urutan" required error={e.sort}>
        <input
          name="sort"
          inputMode="numeric"
          defaultValue={v("sort", String(nilai.sort))}
          className={input}
        />
      </FormField>
      <div className="flex gap-3">
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan"}
        </Button>
        {batal && (
          <a
            href={batal}
            className="inline-flex items-center px-2 text-fg underline underline-offset-2"
          >
            Batal
          </a>
        )}
      </div>
      {s.pesan && !Object.keys(e).length && (
        <p role="alert" className="text-sm text-danger sm:col-span-3">
          {s.pesan}
        </p>
      )}
    </form>
  );
}
