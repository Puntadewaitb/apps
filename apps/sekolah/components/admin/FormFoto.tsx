"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import type { FormState } from "../../lib/validasi";
import { input } from "./ui";

/** Unggah satu/beberapa foto ke album. */
export function FormFoto({
  action,
  albumId,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  albumId: number;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  return (
    <form
      action={kirim}
      aria-label="Unggah foto"
      encType="multipart/form-data"
      className="space-y-3"
    >
      <input type="hidden" name="id" value={albumId} />
      <FormField
        label="Tambah foto"
        error={e.foto}
        hint="PNG, JPG, atau WebP; maksimal 2 MB per foto, hingga 10 foto sekali unggah."
      >
        <input
          name="foto"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
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
        {menunggu ? "Mengunggah…" : "Unggah"}
      </Button>
    </form>
  );
}
