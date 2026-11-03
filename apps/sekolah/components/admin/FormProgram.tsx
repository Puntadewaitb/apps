"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export type NilaiProgram = {
  id?: number;
  title: string;
  description: string;
  target: string;
  deadline: string; // YYYY-MM-DD
  active: boolean;
  image: string;
};

export function FormProgram({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiProgram;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v, c } = pembacaForm(s);
  return (
    <form
      action={kirim}
      aria-label="Form program donasi"
      encType="multipart/form-data"
      className="space-y-5"
    >
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Judul program" required error={e.title}>
        <input
          name="title"
          defaultValue={v("title", nilai.title)}
          maxLength={120}
          className={input}
        />
      </FormField>
      <FormField label="Deskripsi" required error={e.description} hint="20–1200 karakter.">
        <textarea
          name="description"
          rows={5}
          defaultValue={v("description", nilai.description)}
          maxLength={1300}
          className={input}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Target dana (Rp)"
          required
          error={e.target}
          hint="Contoh: 75000000 atau 75.000.000"
        >
          <input
            name="target"
            inputMode="numeric"
            defaultValue={v("target", nilai.target)}
            className={input}
          />
        </FormField>
        <FormField label="Batas waktu" error={e.deadline} hint="Boleh kosong (tanpa batas).">
          <input
            name="deadline"
            type="date"
            defaultValue={v("deadline", nilai.deadline)}
            className={input}
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-fg">
        <input type="checkbox" name="active" defaultChecked={c("active", nilai.active)} /> Aktif
        (tampil di situs publik)
      </label>
      <div className="space-y-2">
        <FormField
          label="Gambar program"
          error={e.gambar}
          hint="PNG, JPG, atau WebP; maksimal 2 MB."
        >
          <input
            name="gambar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
        {nilai.image && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="hapusGambar" /> Hapus gambar saat ini
          </label>
        )}
      </div>
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
          href="/admin/donasi/program"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
