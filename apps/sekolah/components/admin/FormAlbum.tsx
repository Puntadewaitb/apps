"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export function FormAlbum({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: { id?: number; title: string; description: string };
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v } = pembacaForm(s);
  return (
    <form action={kirim} aria-label="Form album" className="space-y-5">
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Judul album" required error={e.title}>
        <input
          name="title"
          defaultValue={v("title", nilai.title)}
          maxLength={100}
          className={input}
        />
      </FormField>
      <FormField label="Deskripsi" error={e.description}>
        <textarea
          name="description"
          rows={3}
          defaultValue={v("description", nilai.description)}
          maxLength={500}
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
          href="/admin/galeri"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
