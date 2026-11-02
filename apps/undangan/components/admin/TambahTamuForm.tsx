"use client";

import { useActionState } from "react";
import { Button } from "@tpl/ui";
import { tambahTamu, type TambahState } from "../../app/admin/tamu/actions";

const awal: TambahState = { ok: false, pesan: "", galat: [] };

export function TambahTamuForm() {
  const [state, formAction, pending] = useActionState(tambahTamu, awal);
  return (
    <form action={formAction} aria-label="Tambah tamu" className="space-y-3">
      <label htmlFor="daftar" className="block text-sm font-medium text-fg">
        Daftar tamu (satu per baris)
      </label>
      <textarea
        id="daftar"
        name="daftar"
        rows={6}
        required
        placeholder={"Bapak Budi & Keluarga; 4; 081234567890\nIbu Dewi; 2\nSahabat Kampus"}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg"
      />
      <p className="text-sm text-muted">
        Format: <code>Nama; jumlah maksimal orang; no HP</code>. Hanya nama yang wajib (default 2
        orang, tanpa HP). Maksimal 200 tamu.
      </p>
      {state.pesan && (
        <div
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "text-success" : "text-danger"}
        >
          <p>{state.pesan}</p>
          {state.galat.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-sm">
              {state.galat.map((g) => (
                <li key={`${g.baris}-${g.pesan}`}>
                  Baris {g.baris}: {g.pesan}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Tambah & Buat Tautan"}
      </Button>
    </form>
  );
}
