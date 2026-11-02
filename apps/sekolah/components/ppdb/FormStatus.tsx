"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { Badge, Button, FormField } from "@tpl/ui";
import { labelDokumen } from "../../content/ppdb";
import { REG_STATUS_LABEL, isOneOf, REG_STATUSES } from "../../lib/domain";
import { formatTanggal } from "../../lib/format";
import type { HasilStatus } from "../../app/(publik)/ppdb/actions";

const input = "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg";

const KETERANGAN: Record<string, string> = {
  BARU: "Pendaftaran Anda sudah kami terima dan menunggu ditinjau panitia.",
  DIPROSES: "Berkas Anda sedang ditinjau. Panitia akan menghubungi bila ada yang perlu dilengkapi.",
  DITERIMA: "Selamat! Calon siswa dinyatakan diterima. Ikuti petunjuk daftar ulang dari panitia.",
  DITOLAK:
    "Mohon maaf, pendaftaran belum dapat kami terima. Hubungi panitia untuk informasi lebih lanjut.",
};

export function FormStatus({
  action,
}: {
  action: (prev: HasilStatus, fd: FormData) => Promise<HasilStatus>;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as HasilStatus);
  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => kirim(fd));
  }
  const d = s.ok ? s.data : undefined;
  const status = d && isOneOf(REG_STATUSES, d.status) ? d.status : undefined;
  return (
    <div className="space-y-8">
      <form
        action={kirim}
        onSubmit={onSubmit}
        aria-label="Form cek status"
        className="max-w-md space-y-4"
      >
        <FormField label="Nomor pendaftaran" required hint="Contoh: PPDB-2027-K7M2XQ">
          <input
            name="nomor"
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
            className={`${input} font-mono uppercase`}
          />
        </FormField>
        <FormField label="Token akses" required hint="Contoh: ABCD-EFGH-JKMN">
          <input
            name="token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
            className={`${input} font-mono uppercase`}
          />
        </FormField>
        {s.ok === false && s.pesan && (
          <p role="alert" data-testid="galat-status" className="text-sm text-danger">
            {s.pesan}
          </p>
        )}
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Memeriksa…" : "Cek Status"}
        </Button>
      </form>

      {d && (
        <section
          aria-labelledby="hasil-judul"
          className="space-y-3 rounded-xl border border-border bg-surface p-6"
          data-testid="hasil-status"
        >
          <h2 id="hasil-judul" className="text-xl font-bold text-fg">
            Status pendaftaran
          </h2>
          <p>
            <Badge tone={status === "DITERIMA" ? "primary" : "neutral"} data-testid="status-badge">
              {status ? REG_STATUS_LABEL[status] : d.status}
            </Badge>
          </p>
          {status && <p className="text-fg">{KETERANGAN[status]}</p>}
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-fg">Nomor pendaftaran</dt>
              <dd className="font-mono text-muted">{d.regNo}</dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Nama calon siswa</dt>
              <dd className="text-muted">{d.studentName}</dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Jenjang tujuan</dt>
              <dd className="text-muted">{d.targetGrade}</dd>
            </div>
            <div>
              <dt className="font-medium text-fg">Tanggal daftar</dt>
              <dd className="text-muted">{formatTanggal(new Date(d.createdAt))}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-fg">Dokumen diterima</dt>
              <dd className="text-muted">
                {d.dokumen.length ? d.dokumen.map(labelDokumen).join(", ") : "—"}
              </dd>
            </div>
          </dl>
          {d.adminNote && (
            <div
              className="rounded-md border border-border bg-bg p-3 text-sm"
              data-testid="catatan-panitia"
            >
              <p className="font-medium text-fg">Catatan panitia</p>
              <p className="whitespace-pre-line text-muted">{d.adminNote}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
