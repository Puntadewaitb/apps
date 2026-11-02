"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export type NilaiAgenda = {
  id?: number;
  title: string;
  description: string;
  location: string;
  startsAt: string; // datetime-local WIB
  endsAt: string;
};

export function FormAgenda({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiAgenda;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v } = pembacaForm(s);
  return (
    <form action={kirim} aria-label="Form agenda" className="space-y-5">
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Nama kegiatan" required error={e.title}>
        <input
          name="title"
          defaultValue={v("title", nilai.title)}
          maxLength={150}
          className={input}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Mulai (WIB)" required error={e.startsAt}>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={v("startsAt", nilai.startsAt)}
            className={input}
          />
        </FormField>
        <FormField label="Selesai (WIB)" error={e.endsAt} hint="Boleh kosong.">
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={v("endsAt", nilai.endsAt)}
            className={input}
          />
        </FormField>
      </div>
      <FormField label="Lokasi" error={e.location}>
        <input
          name="location"
          defaultValue={v("location", nilai.location)}
          maxLength={200}
          className={input}
        />
      </FormField>
      <FormField label="Deskripsi" error={e.description}>
        <textarea
          name="description"
          rows={4}
          defaultValue={v("description", nilai.description)}
          maxLength={2000}
          className={input}
        />
      </FormField>
      {s.pesan && (
        <p role="alert" className="text-sm text-danger">
          {s.pesan}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan"}
        </Button>
        <a
          href="/admin/agenda"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
