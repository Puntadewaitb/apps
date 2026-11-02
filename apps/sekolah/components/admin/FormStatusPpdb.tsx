"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { REG_STATUSES, REG_STATUS_LABEL } from "../../lib/domain";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export function FormStatusPpdb({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: { id: number; status: string; adminNote: string };
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v } = pembacaForm(s);
  return (
    <form action={kirim} aria-label="Form ubah status" className="space-y-4">
      <input type="hidden" name="id" value={nilai.id} />
      <FormField label="Status" error={e.status}>
        <select
          key={v("status", nilai.status)}
          name="status"
          defaultValue={v("status", nilai.status)}
          className={input}
        >
          {REG_STATUSES.map((st) => (
            <option key={st} value={st}>
              {REG_STATUS_LABEL[st]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label="Catatan untuk pendaftar"
        error={e.adminNote}
        hint="Catatan ini TERLIHAT oleh pendaftar di halaman Cek Status (maks. 500 karakter)."
      >
        <textarea
          name="adminNote"
          rows={4}
          defaultValue={v("adminNote", nilai.adminNote)}
          maxLength={600}
          className={input}
        />
      </FormField>
      {s.pesan && (
        <p
          role={s.ok ? "status" : "alert"}
          className={s.ok ? "text-sm text-success" : "text-sm text-danger"}
        >
          {s.pesan}
        </p>
      )}
      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Menyimpan…" : "Simpan status"}
      </Button>
    </form>
  );
}
